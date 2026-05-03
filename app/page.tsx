'use client';
import dynamic from 'next/dynamic';

const Globe = dynamic(() => import('./components/Globe'), { ssr: false });

export default function Home() {
  return (
    <main style={{ width: '100vw', height: '100vh', background: '#000010' }}>
      <div style={{ position: 'absolute', top: 30, width: '100%', textAlign: 'center', zIndex: 10 }}>
        <h1 style={{ color: 'white', fontSize: '2rem', fontFamily: 'sans-serif' }}>
          🌍 GlobalJobMap
        </h1>
        <p style={{ color: '#aaa', fontFamily: 'sans-serif' }}>
          Click any country to explore jobs
        </p>
      </div>
      <Globe />
    </main>
  );
}