'use client'
import { useRef, useMemo, useState } from 'react'
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

function getCountryFromLatLon(lat: number, lon: number): string {
  if (lat > 6 && lat < 38 && lon > 65 && lon < 100) return '🇮🇳 India'
  if (lat > 25 && lat < 50 && lon > 128 && lon < 148) return '🇯🇵 Japan'
  if (lat > 18 && lat < 30 && lon > 48 && lon < 60) return '🇦🇪 UAE'
  if (lat > 48 && lat < 62 && lon > -9 && lon < 3) return '🇬🇧 UK'
  if (lat > 46 && lat < 56 && lon > 5 && lon < 16) return '🇩🇪 Germany'
  if (lat > 48 && lat < 85 && lon > -145 && lon < -50) return '🇨🇦 Canada'
  if (lat > 24 && lat < 50 && lon > -130 && lon < -65) return '🇺🇸 USA'
  if (lat > -45 && lat < -8 && lon > 110 && lon < 158) return '🇦🇺 Australia'
  if (lat > 50 && lat < 80 && lon > 30 && lon < 180) return '🇷🇺 Russia'
  if (lat > 18 && lat < 55 && lon > 100 && lon < 135) return '🇨🇳 China'
  if (lat > 35 && lat < 72 && lon > -12 && lon < 45) return '🌍 Europe'
  if (lat > -58 && lat < 15 && lon > -85 && lon < -30) return '🌎 South America'
  if (lat > -38 && lat < 40 && lon > -20 && lon < 55) return '🌍 Africa'
  if (lat > 10 && lat < 42 && lon > 35 && lon < 65) return '🌏 Middle East'
  if (lat > -12 && lat < 25 && lon > 95 && lon < 128) return '🌏 Southeast Asia'
  return '🌊 Ocean'
}

const jobsByCountry: Record<string, {title: string, salary: string}[]> = {
  '🇮🇳 India': [
    { title: 'Software Engineer', salary: '₹15-25 LPA' },
    { title: 'Data Scientist', salary: '₹12-20 LPA' },
    { title: 'Product Manager', salary: '₹20-35 LPA' },
  ],
  '🇺🇸 USA': [
    { title: 'Software Engineer', salary: '$120k-180k' },
    { title: 'ML Engineer', salary: '$140k-200k' },
    { title: 'DevOps Engineer', salary: '$110k-160k' },
  ],
  '🇬🇧 UK': [
    { title: 'Full Stack Developer', salary: '£60k-90k' },
    { title: 'Data Analyst', salary: '£45k-65k' },
    { title: 'Cloud Architect', salary: '£80k-120k' },
  ],
  '🇩🇪 Germany': [
    { title: 'Backend Developer', salary: '€65k-95k' },
    { title: 'AI Engineer', salary: '€70k-100k' },
    { title: 'UX Designer', salary: '€50k-75k' },
  ],
  '🇦🇺 Australia': [
    { title: 'Software Developer', salary: 'A$90k-130k' },
    { title: 'Cybersecurity Analyst', salary: 'A$85k-120k' },
    { title: 'Project Manager', salary: 'A$95k-140k' },
  ],
  '🇨🇦 Canada': [
    { title: 'Frontend Developer', salary: 'C$80k-120k' },
    { title: 'Data Engineer', salary: 'C$90k-130k' },
    { title: 'QA Engineer', salary: 'C$70k-100k' },
  ],
  '🇯🇵 Japan': [
    { title: 'Software Engineer', salary: '¥6M-10M' },
    { title: 'Game Developer', salary: '¥5M-9M' },
    { title: 'IT Consultant', salary: '¥7M-12M' },
  ],
  '🇦🇪 UAE': [
    { title: 'Full Stack Developer', salary: 'AED 15k-25k/mo' },
    { title: 'Business Analyst', salary: 'AED 12k-20k/mo' },
    { title: 'Cloud Engineer', salary: 'AED 18k-28k/mo' },
  ],
}

function EarthMesh({ onCountryClick }: { onCountryClick: (name: string) => void }) {
  const meshRef = useRef<any>(null)
  const invMat = useMemo(() => new Matrix4(), [])
  const sunVec = useMemo(() => new Vector3(), [])

  const [dayTex, nightTex] = useLoader(TextureLoader, [
    '/earth-day.jpg',
    '/earth-night.jpg',
  ])

  const material = useMemo(() => new ShaderMaterial({
    uniforms: {
      dayTexture: { value: dayTex },
      nightTexture: { value: nightTex },
      sunDir: { value: new Vector3(0, 0, 1) },
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
    if (!e.uv) return
    const lon = e.uv.x * 360 - 180
    const lat = e.uv.y * 180 - 90
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
  const jobs = selected ? (jobsByCountry[selected] || []) : []

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000010' }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.05} />
        <EarthMesh onCountryClick={setSelected} />
        <OrbitControls enableZoom={true} enablePan={false} />
      </Canvas>

      {selected && (
        <div style={{
          position: 'fixed', bottom: 40, left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.9)',
          border: '1px solid #00ffcc',
          borderRadius: 16, padding: '20px 30px',
          color: '#fff', textAlign: 'center',
          zIndex: 100, minWidth: 320
        }}>
          <div style={{ fontSize: 22, fontWeight: 'bold' }}>{selected}</div>
          <div style={{ fontSize: 12, color: '#aaa', marginBottom: 12 }}>Top Jobs</div>
          {jobs.length > 0 ? jobs.map((job, i) => (
            <div key={i} style={{
              background: 'rgba(0,255,204,0.08)',
              border: '1px solid #00ffcc33',
              borderRadius: 8, padding: '8px 12px',
              marginBottom: 6, fontSize: 14,
              display: 'flex', justifyContent: 'space-between'
            }}>
              <span>💼 {job.title}</span>
              <span style={{ color: '#00ffcc' }}>{job.salary}</span>
            </div>
          )) : (
            <div style={{ color: '#aaa', fontSize: 14 }}>🚀 Jobs coming soon!</div>
          )}
          <button onClick={() => setSelected(null)} style={{
            marginTop: 12, padding: '6px 20px',
            background: 'none', border: '1px solid #fff',
            color: '#fff', borderRadius: 8, cursor: 'pointer'
          }}>Close ✕</button>
        </div>
      )}
    </div>
  )
}