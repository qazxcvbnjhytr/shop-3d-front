// src/components/ThreeDViewer.jsx
import React, { useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Html } from "@react-three/drei";
import { Box3, Vector3, TextureLoader, RepeatWrapping } from "three";
import "./styles/ThreeDViewer.css";

// Пути к моделям в public
const AVAILABLE_MODELS = [
  "/models/home/office_chairs_gaming.glb",
  "/models/home/chesterfield-sofa.glb",
];

// Loader при загрузке модели
function Loader() {
  return (
    <Html center>
      <div className="loader-text">Завантаження 3D-моделі...</div>
    </Html>
  );
}

// Fallback при ошибке загрузки модели
function ErrorFallback({ message }) {
  return (
    <Html center>
      <div className="loader-text" style={{ color: "red" }}>
        Помилка завантаження моделі: {message}
      </div>
    </Html>
  );
}

// Плитка-підлога
function TiledFloor({ texturePath = "/textures/wooden-parquet-floor.jpg", size = 20, repeat = 20 }) {
  const texture = new TextureLoader().load(texturePath);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeat, repeat);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

// Модель продукту с нормализацией
function ProductModel({ modelPath, onError }) {
  const gltf = useGLTF(modelPath, true);

  const [positionY, setPositionY] = useState(0);
  const [scaleFactor, setScaleFactor] = useState(1);

  useEffect(() => {
    try {
      const box = new Box3().setFromObject(gltf.scene);
      const size = new Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const desiredSize = 2; // желаемый размер модели
      setScaleFactor(desiredSize / maxDim);
      setPositionY(-box.min.y * (desiredSize / maxDim));

      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    } catch (err) {
      console.error("Ошибка обработки модели:", err);
      if (onError) onError(err);
    }
  }, [gltf, onError]);

  return <primitive object={gltf.scene} scale={scaleFactor} position={[0, positionY, 0]} />;
}

// Автообертання камери
function AutoOrbitControls() {
  const { camera } = useThree();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.3;
    camera.position.x = Math.sin(t) * 5;
    camera.position.z = Math.cos(t) * 5;
    camera.lookAt(0, 1, 0);
  });

  return <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />;
}

// Основной компонент
export default function ThreeDViewer() {
  const [currentModel, setCurrentModel] = useState(0);
  const [error, setError] = useState(null);

  const handleNextModel = () => {
    setError(null);
    setCurrentModel((prev) => (prev + 1) % AVAILABLE_MODELS.length);
  };

  return (
    <div className="viewer-wrapper">
      <Canvas shadows camera={{ position: [5, 1.5, 0], fov: 45 }}>
        <color attach="background" args={["#1b1b1b"]} />
        <Suspense fallback={<Loader />}>
          {error ? (
            <ErrorFallback message={error.message} />
          ) : (
            <>
              <ambientLight intensity={0.6} />
              <spotLight position={[5, 10, 5]} angle={0.3} intensity={1.2} penumbra={1} castShadow />
              <Environment preset="apartment" background={false} />
              <ProductModel
                modelPath={AVAILABLE_MODELS[currentModel]}
                onError={(err) => setError(err)}
              />
              <TiledFloor />
              <AutoOrbitControls />
            </>
          )}
        </Suspense>
      </Canvas>

      {/* Кнопка переключения моделей */}
      <button className="next-model-btn" onClick={handleNextModel}>
        🔄
      </button>
    </div>
  );
}
