'use client'
import { useRef, useMemo } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { TextureLoader, ShaderMaterial, Vector3, Matrix4 } from 'three'
import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'

const vertexShader = `
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    vNormal = normal;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform vec3 sunDir;
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    float d = dot(normalize(vNormal), normalize(sunDir));
    float blend = smoothstep(-0.1, 0.15, d);
    vec4 day   = texture2D(dayTexture,   vUv);
    vec4 night = texture2D(nightTexture, vUv);
    gl_FragColor = mix(night, day, blend);
  }
`

function getSunDirection(): Vector3 {
  const now = new Date()
  const utcH = now.getUTCHours() + now.getUTCMinutes()/60
  const sunLon = ((12 - utcH) / 24) * Math.PI * 2
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  )
  const dec = -23.45 * Math.cos(2 * Math.PI * (dayOfYear + 10) / 365) * (Math.PI / 180)
  return new Vector3(
    Math.cos(dec) * Math.sin(sunLon),
    Math.sin(dec),
    Math.cos(dec) * Math.cos(sunLon)
  ).normalize()
}

function EarthMesh() {
  const meshRef = useRef<any>()
  const invMat = useMemo(() => new Matrix4(), [])
  const sunVec = useMemo(() => new Vector3(), [])

  const [dayTex, nightTex] = useLoader(TextureLoader, [
    '/earth-day.jpg',
    '/earth-night.jpg',
  ])

  const material = useMemo(() => new ShaderMaterial({
    uniforms: {
      dayTexture:   { value: dayTex },
      nightTexture: { value: nightTex },
      sunDir:       { value: new Vector3(0, 0, 1) },
    },
    vertexShader,
    fragmentShader,
  }), [dayTex, nightTex])

  useFrame(() => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += 0.0008
    invMat.copy(meshRef.current.matrixWorld).invert()
    sunVec.copy(getSunDirection())
    sunVec.transformDirection(invMat)
    material.uniforms.sunDir.value.copy(sunVec)
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

export default function Globe() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
      <ambientLight intensity={0.05} />
      <EarthMesh />
      <OrbitControls enableZoom={true} enablePan={false} />
    </Canvas>
  )
}