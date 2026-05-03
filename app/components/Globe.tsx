'use client';
import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

const countries = [
  { name: 'India', lat: 20, lon: 77, color: '#ff9933' },
  { name: 'USA', lat: 37, lon: -95, color: '#3c3b6e' },
  { name: 'UK', lat: 55, lon: -3, color: '#012169' },
  { name: 'Germany', lat: 51, lon: 10, color: '#000000' },
  { name: 'Australia', lat: -25, lon: 133, color: '#00008B' },
  { name: 'Canada', lat: 56, lon: -96, color: '#ff0000' },
  { name: 'Japan', lat: 36, lon: 138, color: '#BC002D' },
  { name: 'UAE', lat: 24, lon: 54, color: '#009900' },
];

function latLonToVec3(lat: number, lon: number, r = 2.05) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

function CountryDot({ name, lat, lon, color, onClick }: any) {
  const pos = latLonToVec3(lat, lon);
  const [hovered, setHovered] = useState(false);
  return (
    <mesh
      position={pos}
      onClick={() => onClick(name)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[hovered ? 0.08 : 0.06, 16, 16]} />
      <meshBasicMaterial color={hovered ? '#ffffff' : color} />
      {hovered && (
        <Html distanceFactor={10}>
          <div style={{ background: 'rgba(0,0,0,0.8)', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: 12, whiteSpace: 'nowrap' }}>
            {name}
          </div>
        </Html>
      )}
    </mesh>
  );
}

function Earth({ onCountryClick }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.001;
  });
  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhongMaterial color="#1a6b3c" emissive="#0a2a1a" specular="#4499ff" shininess={20} />
      </mesh>
      {countries.map(c => (
        <CountryDot key={c.name} {...c} onClick={onCountryClick} />
      ))}
    </group>
  );
}

export default function Globe() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <>
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 3, 5]} intensity={1.5} />
        <Earth onCountryClick={setSelected} />
        <OrbitControls enableZoom={true} enablePan={false} />
      </Canvas>
      {selected && (
        <div style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.9)', color: 'white', padding: '16px 32px', borderRadius: 12, fontSize: '1.2rem', border: '1px solid #333' }}>
          🌍 <b>{selected}</b> — Jobs coming soon!
          <button onClick={() => setSelected(null)} style={{ marginLeft: 16, background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>
      )}
    </>
  );
}