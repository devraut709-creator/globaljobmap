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
  if (lat > 18 && lat < 55 && lon > 100 && lon < 135) return '🇨🇳 China'
  if (lat > 35 && lat < 72 && lon > -12 && lon < 45) return '🌍 Europe'
  if (lat > -58 && lat < 15 && lon > -85 && lon < -30) return '🌎 South America'
  if (lat > -38 && lat < 40 && lon > -20 && lon < 55) return '🌍 Africa'
  if (lat > 10 && lat < 42 && lon > 35 && lon < 65) return '🌏 Middle East'
  return '🌊 Ocean'
}

const countryData: Record<string, {
  capital: string, population: string, currency: string,
  color: string, jobs: {title: string, salary: string, type: string}[]
}> = {
  '🇮🇳 India': {
    capital: 'New Delhi', population: '1.4 Billion', currency: 'INR ₹',
    color: '#FF9933',
    jobs: [
      { title: 'Software Engineer', salary: '₹15–25 LPA', type: 'Full Time' },
      { title: 'Data Scientist', salary: '₹12–20 LPA', type: 'Full Time' },
      { title: 'Product Manager', salary: '₹20–35 LPA', type: 'Full Time' },
      { title: 'UI/UX Designer', salary: '₹8–15 LPA', type: 'Remote' },
    ]
  },
  '🇺🇸 USA': {
    capital: 'Washington D.C.', population: '335 Million', currency: 'USD $',
    color: '#3C3B6E',
    jobs: [
      { title: 'Software Engineer', salary: '$120k–180k', type: 'Full Time' },
      { title: 'ML Engineer', salary: '$140k–200k', type: 'Full Time' },
      { title: 'DevOps Engineer', salary: '$110k–160k', type: 'Remote' },
      { title: 'Product Designer', salary: '$90k–140k', type: 'Hybrid' },
    ]
  },
  '🇬🇧 UK': {
    capital: 'London', population: '68 Million', currency: 'GBP £',
    color: '#012169',
    jobs: [
      { title: 'Full Stack Developer', salary: '£60k–90k', type: 'Full Time' },
      { title: 'Data Analyst', salary: '£45k–65k', type: 'Hybrid' },
      { title: 'Cloud Architect', salary: '£80k–120k', type: 'Remote' },
      { title: 'Scrum Master', salary: '£55k–80k', type: 'Full Time' },
    ]
  },
  '🇩🇪 Germany': {
    capital: 'Berlin', population: '84 Million', currency: 'EUR €',
    color: '#000000',
    jobs: [
      { title: 'Backend Developer', salary: '€65k–95k', type: 'Full Time' },
      { title: 'AI Engineer', salary: '€70k–100k', type: 'Full Time' },
      { title: 'UX Designer', salary: '€50k–75k', type: 'Remote' },
      { title: 'Data Engineer', salary: '€60k–90k', type: 'Hybrid' },
    ]
  },
  '🇦🇺 Australia': {
    capital: 'Canberra', population: '26 Million', currency: 'AUD A$',
    color: '#00008B',
    jobs: [
      { title: 'Software Developer', salary: 'A$90k–130k', type: 'Full Time' },
      { title: 'Cybersecurity Analyst', salary: 'A$85k–120k', type: 'Full Time' },
      { title: 'Project Manager', salary: 'A$95k–140k', type: 'Hybrid' },
      { title: 'Mobile Developer', salary: 'A$80k–120k', type: 'Remote' },
    ]
  },
  '🇨🇦 Canada': {
    capital: 'Ottawa', population: '38 Million', currency: 'CAD C$',
    color: '#FF0000',
    jobs: [
      { title: 'Frontend Developer', salary: 'C$80k–120k', type: 'Full Time' },
      { title: 'Data Engineer', salary: 'C$90k–130k', type: 'Remote' },
      { title: 'QA Engineer', salary: 'C$70k–100k', type: 'Full Time' },
      { title: 'Cloud Consultant', salary: 'C$95k–140k', type: 'Hybrid' },
    ]
  },
  '🇯🇵 Japan': {
    capital: 'Tokyo', population: '125 Million', currency: 'JPY ¥',
    color: '#BC002D',
    jobs: [
      { title: 'Software Engineer', salary: '¥6M–10M', type: 'Full Time' },
      { title: 'Game Developer', salary: '¥5M–9M', type: 'Full Time' },
      { title: 'IT Consultant', salary: '¥7M–12M', type: 'Hybrid' },
      { title: 'Blockchain Dev', salary: '¥8M–14M', type: 'Remote' },
    ]
  },
  '🇦🇪 UAE': {
    capital: 'Abu Dhabi', population: '10 Million', currency: 'AED',
    color: '#00732F',
    jobs: [
      { title: 'Full Stack Developer', salary: 'AED 15k–25k/mo', type: 'Full Time' },
      { title: 'Business Analyst', salary: 'AED 12k–20k/mo', type: 'Hybrid' },
      { title: 'Cloud Engineer', salary: 'AED 18k–28k/mo', type: 'Full Time' },
      { title: 'AI Specialist', salary: 'AED 20k–35k/mo', type: 'Remote' },
    ]
  },
}

function EarthMesh({ onCountryClick }: { onCountryClick: (name: string) => void }) {
  const meshRef = useRef<any>(null)
  const invMat = useMemo(() => new Matrix4(), [])
  const sunVec = useMemo(() => new Vector3(), [])

  const [dayTex, nightTex] = useLoader(TextureLoader, [
    '/earth-day.jpg', '/earth-night.jpg',
  ])

  const material = useMemo(() => new ShaderMaterial({
    uniforms: {
      dayTexture: { value: dayTex },
      nightTexture: { value: nightTex },
      sunDir: { value: new Vector3(0, 0, 1) },
    },
    vertexShader, fragmentShader,
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
    if (country !== '🌊 Ocean') onCountryClick(country)
  }

  return (
    <mesh ref={meshRef} onClick={handleClick}>
      <sphereGeometry args={[2, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

function CountryModal({ country, onClose }: { country: string, onClose: () => void }) {
  const data = countryData[country]
  const accentColor = data?.color || '#00ffcc'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.3s ease',
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { transform:translateY(60px) scale(0.95); opacity:0 } to { transform:translateY(0) scale(1); opacity:1 } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      <div style={{
        background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 100%)',
        border: `1px solid ${accentColor}44`,
        borderRadius: 24,
        padding: '32px',
        maxWidth: 520,
        width: '90vw',
        maxHeight: '85vh',
        overflowY: 'auto',
        boxShadow: `0 0 60px ${accentColor}22`,
        animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        position: 'relative',
      }}>
        {/* Close Button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(255,255,255,0.1)',
          border: 'none', color: '#fff', borderRadius: '50%',
          width: 32, height: 32, cursor: 'pointer', fontSize: 16,
        }}>✕</button>

        {/* Country Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>
            {country.split(' ')[0]}
          </div>
          <h2 style={{ margin: 0, fontSize: 28, color: '#fff', fontWeight: 800 }}>
            {country.split(' ').slice(1).join(' ')}
          </h2>
          <div style={{
            display: 'inline-block', marginTop: 8,
            background: `${accentColor}22`,
            border: `1px solid ${accentColor}`,
            borderRadius: 20, padding: '4px 16px',
            color: accentColor, fontSize: 13,
          }}>
            🌐 Live Job Market
          </div>
        </div>

        {/* Country Stats */}
        {data && (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: 12, marginBottom: 24,
          }}>
            {[
              { label: '🏛️ Capital', value: data.capital },
              { label: '👥 Population', value: data.population },
              { label: '💰 Currency', value: data.currency },
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 12, padding: '12px 8px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Jobs Section */}
        <div style={{ marginBottom: 12 }}>
          <h3 style={{ color: '#fff', margin: '0 0 12px', fontSize: 16 }}>
            💼 Top Jobs
          </h3>
          {data?.jobs ? data.jobs.map((job, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${accentColor}33`,
              borderRadius: 12, padding: '12px 16px',
              marginBottom: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'all 0.2s',
            }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
                  {job.title}
                </div>
                <div style={{ color: '#aaa', fontSize: 12, marginTop: 2 }}>
                  🕐 {job.type}
                </div>
              </div>
              <div style={{
                color: accentColor, fontWeight: 700,
                fontSize: 13, textAlign: 'right',
              }}>
                {job.salary}
              </div>
            </div>
          )) : (
            <div style={{ color: '#aaa', textAlign: 'center', padding: 20 }}>
              🚀 Jobs coming soon!
            </div>
          )}
        </div>

        {/* Apply Button */}
        <button style={{
          width: '100%', padding: '14px',
          background: `linear-gradient(135deg, ${accentColor}, #0088ff)`,
          border: 'none', borderRadius: 12,
          color: '#fff', fontSize: 16,
          fontWeight: 700, cursor: 'pointer',
          marginTop: 8,
        }}>
          🔍 Explore All Jobs
        </button>
      </div>
    </div>
  )
}

export default function Globe() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000010' }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.05} />
        <EarthMesh onCountryClick={setSelected} />
        <OrbitControls enableZoom={true} enablePan={false} />
      </Canvas>

      {selected && (
        <CountryModal country={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}