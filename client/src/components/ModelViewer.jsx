import React, { Suspense, useMemo, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { 
  OrbitControls, 
  Center, 
  Grid, 
  Html, 
  useProgress, 
  useGLTF 
} from "@react-three/drei";
import * as THREE from "three";
import "./styles/ModelViewer.css"; // Переконайтеся, що шлях правильний

const TARGET_SIZE = 4; // Модель буде приведена до розміру 4 одиниці

// ==========================================
// 1. ФУНКЦІЯ: ЛІКУВАННЯ + МАСШТАБУВАННЯ
// ==========================================
const processModel = (scene) => {
  if (!scene) return null;
  
  const clonedScene = scene.clone(true); 

  // 1. Прохід по об'єктах: Фікси для геометрії та матеріалів
  clonedScene.traverse((child) => {
    if (child.isMesh) {
      // 1.1 ФІКС: Щоб об'єкти (двері) не зникали при повороті
      child.frustumCulled = false; 
      child.castShadow = true;
      child.receiveShadow = true;

      // 1.2 ФІКС: Лікування NaN-значень в геометрії
      if (child.geometry && child.geometry.attributes.position) {
        const attr = child.geometry.attributes.position;
        const array = attr.array;
        let broken = false;
        for (let i = 0; i < array.length; i++) {
          if (isNaN(array[i])) {
            array[i] = 0; // Замінюємо NaN на 0
            broken = true;
          }
        }
        if (broken) {
          attr.needsUpdate = true;
          child.geometry.computeBoundingSphere();
          child.geometry.computeBoundingBox();
        }
      }

      // 1.3 Налаштування матеріалів
      if (child.material) {
        child.material.side = THREE.DoubleSide;
        child.material.depthWrite = true;
        // Пом'якшення блиску
        if (child.material.metalness > 0.6) child.material.metalness = 0.2;
        if (child.material.roughness < 0.2) child.material.roughness = 0.5;
        child.material.needsUpdate = true;
      }
    }
  });

  // 2. АВТО-МАСШТАБУВАННЯ: Приводимо модель до TARGET_SIZE
  // Вимірюємо розмір першого головного об'єкта для надійності
  const targetObject = clonedScene.children.length > 0 ? clonedScene.children[0] : clonedScene;
  
  if (targetObject) {
    const box = new THREE.Box3().setFromObject(targetObject);
    const size = new THREE.Vector3();
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);

    if (maxDim > 0 && isFinite(maxDim)) {
      const scaleFactor = TARGET_SIZE / maxDim;
      clonedScene.scale.setScalar(scaleFactor); 
    }
  }

  return clonedScene;
};

// ==========================================
// 2. КОМПОНЕНТ МОДЕЛІ (Обробка завантаження)
// ==========================================
const GlbModel = ({ url }) => {
  // Використовуємо useGLTF для завантаження
  const gltf = useGLTF(url, true);
  
  const processedScene = useMemo(() => {
    // Безпечна перевірка
    if (!gltf || !gltf.scene) return null;
    try {
      // Викликаємо функцію обробки лише один раз при завантаженні
      return processModel(gltf.scene); 
    } catch (e) {
      console.error("3D Model processing failed:", e);
      return null;
    }
  }, [gltf]); 

  if (!processedScene) return null;

  return <primitive object={processedScene} />;
};

// ==========================================
// 3. СЦЕНА (Освітлення та Сітка)
// ==========================================
const SceneContent = ({ url }) => {
  return (
    <>
      {/* 1. Освітлення (надійне, легке для GPU) */}
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 10, 5]} intensity={2} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={1} />

      {/* 2. Сітка */}
      <Grid 
        position={[0, -0.01, 0]} 
        args={[10, 10]} 
        cellSize={0.5} 
        cellThickness={0.5} 
        cellColor="#6f6f6f" 
        sectionSize={3} 
        infiniteGrid 
        fadeDistance={25}
      />

      {/* 3. Центрування (модель вже масштабована) */}
      <Center top>
        <GlbModel url={url} />
      </Center>
    </>
  );
};

// Індикатор завантаження
const LoaderUI = () => {
  const { progress } = useProgress();
  return <Html center><div className="viewer-loader">{progress.toFixed(0)}% Loading...</div></Html>;
};

// ==========================================
// 4. ГОЛОВНИЙ ЕКСПОРТ
// ==========================================
export default function ModelViewer({ modelUrl, onClose }) {
  
  // Блокування скролу сторінки
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = originalStyle; };
  }, []);

  if (!modelUrl) return null;

  return (
    <div className="viewer-overlay">
      <div className="viewer-window">
        {/* HEADER */}
        <div className="viewer-header">
          <div className="viewer-title">
            <span>🧊 3D Viewer (GLB)</span>
          </div>
          <button className="viewer-btn close" onClick={onClose}>✕</button>
        </div>

        {/* CANVAS */}
        <div className="viewer-canvas-area">
          <Canvas 
            dpr={[1, 1.5]} 
            // Камера встановлена на відстань, комфортну для моделі розміром 4
            camera={{ position: [4, 4, 6], fov: 45 }} 
            shadows={false} 
          >
            <color attach="background" args={["#1e1e1e"]} />
            
            <Suspense fallback={<LoaderUI />}>
               {/* key={modelUrl} - важливий для запобігання Context Lost при зміні моделі */}
              <SceneContent key={modelUrl} url={modelUrl} />
            </Suspense>

            <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.8} />
          </Canvas>
        </div>
      </div>
    </div>
  );
}