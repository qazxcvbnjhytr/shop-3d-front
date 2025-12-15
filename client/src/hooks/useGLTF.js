import React from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Stage } from '@react-three/drei';

function Model(props) {
  // Грузим один файл .glb
  const { scene } = useGLTF('/models/my-model.glb');
  return <primitive object={scene} {...props} />;
}

export default function App() {
  return (
    <div style={{ height: "100vh", background: "#1a1a1a" }}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 5] }}>
        <Stage adjustCamera intensity={0.5} environment="studio">
          <Model />
        </Stage>
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}