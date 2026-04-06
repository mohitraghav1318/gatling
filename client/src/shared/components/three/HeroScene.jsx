import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float } from '@react-three/drei';
import { SCENE_COLORS } from '../../config/theme';

function MeshCluster() {
  const torusRef = useRef(null);
  const sphereRef = useRef(null);

  // Simple frame loop for smooth motion and depth.
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (torusRef.current) {
      torusRef.current.rotation.x = time * 0.17;
      torusRef.current.rotation.y = time * 0.26;
    }

    if (sphereRef.current) {
      sphereRef.current.position.y = Math.sin(time * 0.85) * 0.15;
      sphereRef.current.rotation.y = time * 0.23;
    }
  });

  return (
    <group>
      <Float speed={1.8} rotationIntensity={0.8} floatIntensity={1.1}>
        <mesh ref={torusRef} position={[-0.5, 0, 0]}>
          <torusKnotGeometry args={[0.68, 0.19, 220, 36]} />
          <meshStandardMaterial
            color={SCENE_COLORS.accentMesh}
            metalness={0.34}
            roughness={0.36}
          />
        </mesh>
      </Float>

      <Float speed={1.2} rotationIntensity={0.6} floatIntensity={0.8}>
        <mesh ref={sphereRef} position={[1.25, 0.05, -0.3]}>
          <icosahedronGeometry args={[0.5, 4]} />
          <meshStandardMaterial
            color={SCENE_COLORS.secondaryMesh}
            metalness={0.15}
            roughness={0.42}
          />
        </mesh>
      </Float>
    </group>
  );
}

export default function HeroScene() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 opacity-40">
      <Canvas camera={{ position: [0, 0, 4.2], fov: 52 }}>
        <ambientLight intensity={0.74} color={SCENE_COLORS.keyLight} />
        <directionalLight
          position={[3.2, 2.4, 2.6]}
          intensity={1.3}
          color={SCENE_COLORS.fillLight}
        />
        <MeshCluster />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
