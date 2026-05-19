import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Environment } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';

/**
 * The centerpiece of the hero. A slowly distorting sphere with rim lighting,
 * a soft inner glow via an emissive layer, and orbiting particles.
 *
 * Designed to be subtle. Not a "showcase glob of chrome" — a quiet, alive object.
 */

function OrbCore() {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime;
    mesh.current.rotation.y = t * 0.12;
    mesh.current.rotation.x = Math.sin(t * 0.3) * 0.08;
  });

  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={1.1}>
      <Sphere ref={mesh} args={[1.4, 96, 96]}>
        <MeshDistortMaterial
          color="#7c3aed"
          emissive="#4c1d95"
          emissiveIntensity={0.4}
          roughness={0.15}
          metalness={0.7}
          distort={0.35}
          speed={1.4}
          envMapIntensity={1.2}
        />
      </Sphere>
      {/* Inner haze sphere — gives the orb a soft halo */}
      <Sphere args={[1.55, 32, 32]}>
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.06} />
      </Sphere>
    </Float>
  );
}

function OrbitingRing({ radius, speed, color }: { radius: number; speed: number; color: string }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.z = state.clock.elapsedTime * speed;
  });
  return (
    <group ref={group} rotation={[Math.PI / 2.5, 0.3, 0]}>
      <mesh>
        <torusGeometry args={[radius, 0.005, 16, 128]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

export function AIOrb({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          {/* Lighting — three-point rig, accent-coloured rim */}
          <ambientLight intensity={0.15} />
          <directionalLight position={[5, 3, 5]} intensity={1.2} color="#ffffff" />
          <pointLight position={[-5, -2, -3]} intensity={2.5} color="#22d3ee" />
          <pointLight position={[3, -3, 2]} intensity={1.5} color="#e11d6a" />

          <OrbCore />
          <OrbitingRing radius={2.0} speed={0.18} color="#a78bfa" />
          <OrbitingRing radius={2.4} speed={-0.12} color="#22d3ee" />

          <Environment preset="night" />
        </Suspense>
      </Canvas>
    </div>
  );
}
