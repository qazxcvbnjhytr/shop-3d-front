import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Html, useGLTF } from "@react-three/drei";

import { FiBox, FiX, FiCamera } from "react-icons/fi";
import "./ModelViewerModal.css";

function hexToRGB01(hex) {
  const clean = String(hex || "").replace("#", "").trim();
  if (clean.length !== 6) return [0, 0, 0];
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function safeFilename(name) {
  return String(name || "3d-view")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\-_ ]/gu, "")
    .replace(/\s+/g, "-")
    .slice(0, 80) || "3d-view";
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function Loader() {
  return (
    <Html center>
      <div className="mv-loader">
        <div className="mv-spinner" />
        <div className="mv-loaderText">Завантаження 3D…</div>
      </div>
    </Html>
  );
}

/** Поставити модель так, щоб її низ був на Y=0 + центрувати по XZ */
function groundAndCenter(object3D) {
  if (!object3D) return;

  object3D.updateWorldMatrix(true, true);

  const box = new THREE.Box3().setFromObject(object3D);
  if (!Number.isFinite(box.min.y) || !Number.isFinite(box.max.y)) return;

  const center = new THREE.Vector3();
  box.getCenter(center);

  const dx = -center.x;
  const dz = -center.z;
  const dy = -box.min.y;

  object3D.position.set(dx, object3D.position.y + dy, dz);
  object3D.updateWorldMatrix(true, true);
}

/** Підігнати камеру під об’єкт */
function fitCameraToObject(camera, controls, object3D) {
  if (!camera || !controls || !object3D) return;

  const box = new THREE.Box3().setFromObject(object3D);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = (camera.fov * Math.PI) / 180;

  let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
  cameraZ *= 1.35;

  camera.position.set(center.x + cameraZ, center.y + cameraZ * 0.55, center.z + cameraZ);
  camera.near = Math.max(0.01, maxDim / 100);
  camera.far = Math.max(2000, cameraZ * 20);
  camera.updateProjectionMatrix();

  controls.target.copy(center);
  controls.update();
}

function Model({ url, onReady }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    // 1) ставимо на підлогу
    groundAndCenter(cloned);
    // 2) callback щоб підігнати камеру
    onReady?.(cloned);
  }, [cloned, onReady]);

  return <primitive object={cloned} />;
}

function ModalContent({ modelUrl, onClose }) {
  const [preset, setPreset] = useState("blender");
  const [customBg, setCustomBg] = useState("#121417");
  const [showFloor, setShowFloor] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const glRef = useRef(null);

  const [shotBusy, setShotBusy] = useState(false);

  const presetMap = useMemo(
    () => ({
      blender: {
        label: "Blender (стандарт)",
        bg: "#121417",
        floor: "#1b1f26",
        gridMain: "#1e90ff",
        gridSub: "#0f3f7a",
        env: "city",
        light: 1.0,
      },
      studio: {
        label: "Студія (світлий)",
        bg: "#f2f2f2",
        floor: "#e7e7e7",
        gridMain: "#2f6fff",
        gridSub: "#9db9ff",
        env: "studio",
        light: 1.2,
      },
      white: {
        label: "Білий",
        bg: "#ffffff",
        floor: "#f6f6f6",
        gridMain: "#2f6fff",
        gridSub: "#b9d0ff",
        env: "studio",
        light: 1.15,
      },
      black: {
        label: "Чорний",
        bg: "#0b0c0e",
        floor: "#14171d",
        gridMain: "#1e90ff",
        gridSub: "#0e3a70",
        env: "city",
        light: 0.95,
      },
      custom: {
        label: "Свій колір",
        bg: customBg,
        floor: "#1b1f26",
        gridMain: "#1e90ff",
        gridSub: "#0f3f7a",
        env: "city",
        light: 1.0,
      },
    }),
    [customBg]
  );

  const active = presetMap[preset] || presetMap.blender;
  const bgRGB = useMemo(() => hexToRGB01(active.bg), [active.bg]);
  const floorRGB = useMemo(() => hexToRGB01(active.floor), [active.floor]);

  const close = useCallback(() => onClose?.(), [onClose]);

  // ESC close
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  // lock scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleModelReady = useCallback((obj) => {
    const cam = cameraRef.current;
    const ctrls = controlsRef.current;
    if (!cam || !ctrls || !obj) return;

    // ще раз гарантуємо що низ = 0
    groundAndCenter(obj);

    fitCameraToObject(cam, ctrls, obj);
  }, []);

  const takeScreenshot = useCallback(async () => {
    const gl = glRef.current;
    if (!gl) return;

    try {
      setShotBusy(true);

      // гарантуємо, що в буфері актуальний кадр
      gl.renderLists?.dispose?.();
      gl.render(gl.scene, gl.camera);

      const canvas = gl.domElement;
      const dataUrl = canvas.toDataURL("image/png");

      const file = `${safeFilename("3d-screenshot")}-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.png`;

      downloadDataUrl(dataUrl, file);
    } catch (e) {
      console.error("Screenshot error:", e);
      alert("Не вдалося зробити скріншот. Спробуй ще раз.");
    } finally {
      setShotBusy(false);
    }
  }, []);

  return (
    <div
      className="mv-overlay mv-overlay--fullscreen"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="mv-modal mv-modal--fullscreen">
        <div className="mv-topbar">
          <div className="mv-title">
            <FiBox />
            <span>3D перегляд</span>
          </div>

          <div className="mv-topbarActions">
            <button
              className="mv-iconBtn"
              onClick={takeScreenshot}
              type="button"
              title="Зберегти скріншот"
              aria-label="Screenshot"
              disabled={shotBusy}
            >
              <FiCamera />
            </button>

            <button className="mv-iconBtn" onClick={close} type="button" aria-label="Close">
              <FiX />
            </button>
          </div>
        </div>

        <div className="mv-controls">
          <div className="mv-leftControls">
            <div className="mv-field">
              <div className="mv-row mv-row--bg">
                <div className="mv-label mv-label--inline">Фон</div>

                <div className="mv-presets mv-presets--inline">
                  <button
                    type="button"
                    className={`mv-chip ${preset === "blender" ? "is-active" : ""}`}
                    onClick={() => setPreset("blender")}
                  >
                    Blender
                  </button>

                  <button
                    type="button"
                    className={`mv-chip ${preset === "studio" ? "is-active" : ""}`}
                    onClick={() => setPreset("studio")}
                  >
                    Студія
                  </button>

                  <button
                    type="button"
                    className={`mv-chip ${preset === "white" ? "is-active" : ""}`}
                    onClick={() => setPreset("white")}
                  >
                    Білий
                  </button>

                  <button
                    type="button"
                    className={`mv-chip ${preset === "black" ? "is-active" : ""}`}
                    onClick={() => setPreset("black")}
                  >
                    Чорний
                  </button>
                </div>

                <select className="mv-select" value={preset} onChange={(e) => setPreset(e.target.value)}>
                  <option value="blender">{presetMap.blender.label}</option>
                  <option value="studio">{presetMap.studio.label}</option>
                  <option value="white">{presetMap.white.label}</option>
                  <option value="black">{presetMap.black.label}</option>
                  <option value="custom">{presetMap.custom.label}</option>
                </select>

                <input
                  className="mv-color"
                  type="color"
                  value={customBg}
                  title="Обрати колір фону"
                  onChange={(e) => {
                    setCustomBg(e.target.value);
                    setPreset("custom");
                  }}
                />
              </div>
            </div>

            <div className="mv-hint">
              Перетягни мишкою — обертання. Колесо — зум. Права кнопка — панорама. ESC — закрити.
            </div>
          </div>

          <div className="mv-rightControls">
            <label className="mv-check">
              <input type="checkbox" checked={showFloor} onChange={(e) => setShowFloor(e.target.checked)} />
              <span>Підлога</span>
            </label>

            <label className="mv-check">
              <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
              <span>Сітка</span>
            </label>
          </div>
        </div>

        <div className="mv-canvasWrap mv-canvasWrap--fullscreen">
          <Canvas
            dpr={[1, 2]}
            camera={{ position: [3, 2, 3], fov: 45, near: 0.01, far: 2000 }}
            gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
            onCreated={({ camera, gl, scene }) => {
              cameraRef.current = camera;

              // збережемо gl + також підкинемо посилання на scene/camera для render у скріншоті
              glRef.current = gl;
              gl.scene = scene;
              gl.camera = camera;
            }}
          >
            <color attach="background" args={bgRGB} />

            <ambientLight intensity={0.35 * active.light} />
            <directionalLight position={[4, 6, 3]} intensity={1.0 * active.light} />
            <directionalLight position={[-4, 4, -3]} intensity={0.45 * active.light} />

            <Suspense fallback={null}>
              <Environment preset={active.env} />
            </Suspense>

            {showFloor ? (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[500, 500]} />
                <meshStandardMaterial color={floorRGB} roughness={0.98} metalness={0.0} />
              </mesh>
            ) : null}

            {showGrid ? (
              <gridHelper args={[500, 250, active.gridMain, active.gridSub]} position={[0, 0, 0]} />
            ) : null}

            <Suspense fallback={<Loader />}>
              <Model url={modelUrl} onReady={handleModelReady} />
            </Suspense>

            <OrbitControls
              ref={controlsRef}
              makeDefault
              enableDamping
              dampingFactor={0.08}
              rotateSpeed={0.7}
              zoomSpeed={0.8}
              panSpeed={0.7}
              minDistance={0.15}
              maxDistance={80}
            />
          </Canvas>
        </div>
      </div>
    </div>
  );
}

export default function ModelViewer({ modelUrl, onClose }) {
  if (!modelUrl) return null;

  // Portal в body — гарантія, що буде 100% екран і не обріжеться header-ами/контейнерами
  return createPortal(<ModalContent modelUrl={modelUrl} onClose={onClose} />, document.body);
}
