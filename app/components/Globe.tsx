'use client'
import { useRef, useMemo, useState } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { TextureLoader, ShaderMaterial, Vector3, Matrix4, Raycaster, Vector2 } from 'three'
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
  const utcH = now.getUTCHours() + now.getUTCMinutes() / 60
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

// Lat/Lon se Country detect karo
function getCountryFromLatLon(lat: number, lon: number): string {
  if (lat > 8 && lat < 37 && lon > 68 && lon < 97) return '🇮🇳 India'
  if (lat > 24 && lat < 49 && lon > -125 && lon < -66) return '🇺🇸 USA'
  if (lat > 49 && lat < 60 && lon > -8 && lon < 2) return '🇬🇧 UK'
  if (lat > 47 && lat < 55 && lon > 6 && lon < 15) return '🇩🇪 Germany'
  if (lat > -44 && lat < -10 && lon > 113 && lon < 154) return '🇦🇺 Australia'
  if (lat > 41 && lat < 83 && lon > -141 && lon < -52) return '🇨🇦 Canada'
  if (lat > 30 && lat < 45 && lon > 130 && lon < 145) return '🇯🇵 Japan'
  if (lat > 22 && lat < 26 && lon > 51 && lon < 56) return '🇦🇪 UAE'
  if (lat > 35 && lat < 72 && lon > -10 && lon < 40) return '🌍 Europe'
  if (lat > -35 && lat < 37 && lon > -18 && lon < 52) return '🌍 Africa'
  if (lat > -56 && lat < 13 && lon > -82 && lon < -34) return '🌎 South America'
  if (lat > 1 && lat < 55 && lon > 40 && lon < 68) return '🌏 Middle East / Central Asia'
  return '🌊 Ocean'
}

function EarthMesh({ onCountryClick }: { onCountryClick: (name: string) => void }) {
  const meshRef = useRef<any>(null)
  const invMat = useMemo(() => new Matrix4(), [])
  const sunVec = useMemo(() => new Vector3(), [])
  const { camera } = useThree()

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
    invMat.copy(meshRef.current.matrixWorld).invert()
    sunVec.copy(getSunDirection())
    sunVec.transformDirection(invMat)
    material.uniforms.sunDir.value.copy(sunVec)
  })

 const handleClick = (e: any) => {
    e.stopPropagation()
    if (!meshRef.current) return
    const local = e.point.clone().applyMatrix4(
      meshRef.current.matrixWorld.clone().invert()
    )
    local.normalize()
    const lat = Math.asin(local.y) * (180 / Math.PI)
    const lon = Math.atan2(local.x, local.z) * (180 / Math.PI)
    const country = getCountryFromLatLon(lat, lon)
    onCountryClick(country)
  }

  return (
    <mesh ref={meshRef} onClick={handleClick}>
      <sphereGeometry args={[2, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

export default function Globe() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000010' }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.05} />
        <EarthMesh onCountryClick={setSelected} />
        <OrbitControls enableZoom={true} enablePan={false} autoRotate={true} autoRotateSpeed={0.5} />
      </Canvas>

      {/* Country Popup */}
      {selected && (
        <div style={{
          position: 'fixed', bottom: 40, left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.85)',
          border: '1px solid #00ffcc',
          borderRadius: 16, padding: '20px 40px',
          color: '#fff', fontSize: 22, fontWeight: 'bold',
          textAlign: 'center', zIndex: 100
        }}>
          {selected}
          <div style={{ fontSize: 14, color: '#00ffcc', marginTop: 8 }}>
            Jobs coming soon...
          </div>
          <button
            onClick={() => setSelected(null)}
            style={{
              marginTop: 12, padding: '6px 20px',
              background: 'none', border: '1px solid #fff',
              color: '#fff', borderRadius: 8, cursor: 'pointer'
            }}
          >
            Close ✕
          </button>
        </div>
      )}
    </div>
  )
}