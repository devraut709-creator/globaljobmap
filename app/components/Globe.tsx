"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

// ─────────────────────────────────────────────
// COUNTRY DATA WITH STATES
// ─────────────────────────────────────────────
const COUNTRIES: Record<string, {
  name: string; flag: string; lat: number; lon: number;
  color: string;
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number };
  states: { name: string; lat: number; lon: number }[];
}> = {
  IN: {
    name: "India", flag: "🇮🇳", lat: 20, lon: 78, color: "#FF6B00",
    bounds: { minLat: 6, maxLat: 38, minLon: 65, maxLon: 100 },
    states: [
      { name: "Maharashtra", lat: 19.7, lon: 75.7 },
      { name: "Karnataka", lat: 15.3, lon: 75.7 },
      { name: "Tamil Nadu", lat: 11.1, lon: 78.6 },
      { name: "Delhi", lat: 28.6, lon: 77.2 },
      { name: "West Bengal", lat: 22.9, lon: 87.8 },
      { name: "Gujarat", lat: 22.2, lon: 71.1 },
      { name: "Rajasthan", lat: 27.0, lon: 74.2 },
      { name: "Uttar Pradesh", lat: 26.8, lon: 80.9 },
      { name: "Bihar", lat: 25.0, lon: 85.3 },
      { name: "Madhya Pradesh", lat: 22.9, lon: 78.6 },
      { name: "Andhra Pradesh", lat: 15.9, lon: 79.7 },
      { name: "Telangana", lat: 17.1, lon: 79.0 },
      { name: "Kerala", lat: 10.8, lon: 76.2 },
      { name: "Punjab", lat: 31.1, lon: 75.3 },
      { name: "Haryana", lat: 29.0, lon: 76.0 },
      { name: "Odisha", lat: 20.9, lon: 85.0 },
      { name: "Assam", lat: 26.2, lon: 92.9 },
      { name: "Jharkhand", lat: 23.6, lon: 85.2 },
      { name: "Chhattisgarh", lat: 21.2, lon: 81.6 },
      { name: "Uttarakhand", lat: 30.0, lon: 79.0 },
      { name: "Himachal Pradesh", lat: 31.1, lon: 77.1 },
      { name: "Goa", lat: 15.2, lon: 74.1 },
      { name: "Tripura", lat: 23.9, lon: 91.9 },
      { name: "Manipur", lat: 24.6, lon: 93.9 },
      { name: "Meghalaya", lat: 25.4, lon: 91.3 },
      { name: "Nagaland", lat: 26.1, lon: 94.5 },
      { name: "Arunachal Pradesh", lat: 28.2, lon: 94.7 },
      { name: "Mizoram", lat: 23.1, lon: 92.9 },
      { name: "Sikkim", lat: 27.5, lon: 88.5 },
      { name: "J&K", lat: 33.7, lon: 76.9 },
      { name: "Ladakh", lat: 34.1, lon: 77.5 },
      { name: "Chandigarh", lat: 30.7, lon: 76.7 },
      { name: "Puducherry", lat: 11.9, lon: 79.8 },
      { name: "Andaman", lat: 11.6, lon: 92.7 },
      { name: "Lakshadweep", lat: 10.5, lon: 72.6 },
      { name: "D&N Haveli", lat: 20.1, lon: 73.0 },
    ],
  },
  US: {
    name: "USA", flag: "🇺🇸", lat: 38, lon: -97, color: "#003087",
    bounds: { minLat: 24, maxLat: 50, minLon: -130, maxLon: -65 },
    states: [
      { name: "California", lat: 36.7, lon: -119.4 },
      { name: "Texas", lat: 31.0, lon: -99.9 },
      { name: "New York", lat: 42.1, lon: -74.2 },
      { name: "Florida", lat: 27.6, lon: -81.5 },
      { name: "Illinois", lat: 40.6, lon: -89.3 },
      { name: "Pennsylvania", lat: 41.2, lon: -77.2 },
      { name: "Ohio", lat: 40.4, lon: -82.7 },
      { name: "Georgia", lat: 32.1, lon: -82.9 },
      { name: "North Carolina", lat: 35.6, lon: -79.8 },
      { name: "Michigan", lat: 44.3, lon: -85.4 },
      { name: "Washington", lat: 47.4, lon: -120.4 },
      { name: "Arizona", lat: 34.0, lon: -111.9 },
      { name: "Massachusetts", lat: 42.2, lon: -71.5 },
      { name: "Tennessee", lat: 35.7, lon: -86.6 },
      { name: "Indiana", lat: 40.2, lon: -86.1 },
      { name: "Missouri", lat: 38.4, lon: -92.4 },
      { name: "Maryland", lat: 39.0, lon: -76.8 },
      { name: "Wisconsin", lat: 44.2, lon: -89.9 },
      { name: "Colorado", lat: 39.0, lon: -105.3 },
      { name: "Minnesota", lat: 45.7, lon: -93.9 },
      { name: "South Carolina", lat: 33.8, lon: -81.1 },
      { name: "Alabama", lat: 32.7, lon: -86.8 },
      { name: "Louisiana", lat: 31.1, lon: -91.8 },
      { name: "Kentucky", lat: 37.5, lon: -85.3 },
      { name: "Oregon", lat: 43.8, lon: -120.5 },
      { name: "Oklahoma", lat: 35.5, lon: -96.9 },
      { name: "Connecticut", lat: 41.6, lon: -72.7 },
      { name: "Utah", lat: 39.3, lon: -111.0 },
      { name: "Iowa", lat: 42.0, lon: -93.2 },
      { name: "Nevada", lat: 38.8, lon: -116.4 },
      { name: "Arkansas", lat: 34.8, lon: -92.1 },
      { name: "Mississippi", lat: 32.7, lon: -89.6 },
      { name: "Kansas", lat: 38.5, lon: -98.3 },
      { name: "New Mexico", lat: 34.3, lon: -106.0 },
      { name: "Nebraska", lat: 41.5, lon: -99.9 },
      { name: "Idaho", lat: 44.2, lon: -114.4 },
      { name: "West Virginia", lat: 38.6, lon: -80.6 },
      { name: "Hawaii", lat: 19.8, lon: -155.6 },
      { name: "New Hampshire", lat: 43.4, lon: -71.5 },
      { name: "Maine", lat: 45.2, lon: -69.0 },
      { name: "Montana", lat: 46.8, lon: -110.3 },
      { name: "Rhode Island", lat: 41.6, lon: -71.5 },
      { name: "Delaware", lat: 38.9, lon: -75.5 },
      { name: "South Dakota", lat: 44.2, lon: -100.2 },
      { name: "North Dakota", lat: 47.4, lon: -100.4 },
      { name: "Alaska", lat: 64.2, lon: -153.4 },
      { name: "Vermont", lat: 44.0, lon: -72.6 },
      { name: "Wyoming", lat: 43.0, lon: -107.5 },
      { name: "Virginia", lat: 37.7, lon: -78.1 },
      { name: "New Jersey", lat: 40.2, lon: -74.7 },
      { name: "DC", lat: 38.9, lon: -77.0 },
    ],
  },
  GB: {
    name: "United Kingdom", flag: "🇬🇧", lat: 54, lon: -2, color: "#00247D",
    bounds: { minLat: 48, maxLat: 62, minLon: -9, maxLon: 3 },
    states: [
      { name: "England", lat: 52.3, lon: -1.1 },
      { name: "Scotland", lat: 56.4, lon: -4.2 },
      { name: "Wales", lat: 52.1, lon: -3.7 },
      { name: "Northern Ireland", lat: 54.6, lon: -6.6 },
      { name: "London", lat: 51.5, lon: -0.1 },
      { name: "Manchester", lat: 53.4, lon: -2.2 },
      { name: "Birmingham", lat: 52.4, lon: -1.8 },
      { name: "Glasgow", lat: 55.8, lon: -4.2 },
      { name: "Edinburgh", lat: 55.9, lon: -3.2 },
      { name: "Leeds", lat: 53.8, lon: -1.5 },
      { name: "Bristol", lat: 51.4, lon: -2.6 },
    ],
  },
  DE: {
    name: "Germany", flag: "🇩🇪", lat: 51, lon: 10, color: "#000000",
    bounds: { minLat: 46, maxLat: 56, minLon: 5, maxLon: 16 },
    states: [
      { name: "Bavaria", lat: 48.7, lon: 11.5 },
      { name: "North Rhine-Westphalia", lat: 51.4, lon: 7.6 },
      { name: "Baden-Württemberg", lat: 48.5, lon: 9.0 },
      { name: "Lower Saxony", lat: 52.6, lon: 9.7 },
      { name: "Hesse", lat: 50.6, lon: 9.0 },
      { name: "Saxony", lat: 51.1, lon: 13.2 },
      { name: "Rhineland-Palatinate", lat: 49.9, lon: 7.4 },
      { name: "Berlin", lat: 52.5, lon: 13.4 },
      { name: "Schleswig-Holstein", lat: 54.2, lon: 9.6 },
      { name: "Brandenburg", lat: 52.4, lon: 13.0 },
      { name: "Saxony-Anhalt", lat: 51.9, lon: 11.7 },
      { name: "Thuringia", lat: 50.8, lon: 11.0 },
      { name: "Hamburg", lat: 53.5, lon: 10.0 },
      { name: "Mecklenburg", lat: 53.6, lon: 12.4 },
      { name: "Saarland", lat: 49.4, lon: 7.0 },
      { name: "Bremen", lat: 53.0, lon: 8.8 },
    ],
  },
  AU: {
    name: "Australia", flag: "🇦🇺", lat: -27, lon: 134, color: "#00008B",
    bounds: { minLat: -45, maxLat: -8, minLon: 110, maxLon: 158 },
    states: [
      { name: "New South Wales", lat: -31.2, lon: 146.9 },
      { name: "Victoria", lat: -36.8, lon: 144.9 },
      { name: "Queensland", lat: -20.9, lon: 142.7 },
      { name: "Western Australia", lat: -25.3, lon: 122.0 },
      { name: "South Australia", lat: -30.0, lon: 135.7 },
      { name: "Tasmania", lat: -41.4, lon: 146.6 },
      { name: "ACT", lat: -35.4, lon: 149.0 },
      { name: "Northern Territory", lat: -19.4, lon: 132.5 },
    ],
  },
  CA: {
    name: "Canada", flag: "🇨🇦", lat: 56, lon: -96, color: "#FF0000",
    bounds: { minLat: 48, maxLat: 85, minLon: -145, maxLon: -50 },
    states: [
      { name: "Ontario", lat: 50.0, lon: -85.0 },
      { name: "Quebec", lat: 52.9, lon: -73.5 },
      { name: "British Columbia", lat: 53.7, lon: -127.6 },
      { name: "Alberta", lat: 53.9, lon: -116.5 },
      { name: "Manitoba", lat: 53.7, lon: -98.8 },
      { name: "Saskatchewan", lat: 52.9, lon: -106.4 },
      { name: "Nova Scotia", lat: 44.6, lon: -63.5 },
      { name: "New Brunswick", lat: 46.5, lon: -66.4 },
      { name: "Newfoundland", lat: 53.1, lon: -57.6 },
      { name: "Prince Edward Island", lat: 46.5, lon: -63.4 },
      { name: "Yukon", lat: 64.2, lon: -135.0 },
      { name: "Northwest Territories", lat: 64.8, lon: -124.8 },
      { name: "Nunavut", lat: 70.2, lon: -83.1 },
    ],
  },
  JP: {
    name: "Japan", flag: "🇯🇵", lat: 36, lon: 138, color: "#BC002D",
    bounds: { minLat: 25, maxLat: 50, minLon: 128, maxLon: 148 },
    states: [
      { name: "Tokyo", lat: 35.6, lon: 139.6 },
      { name: "Osaka", lat: 34.6, lon: 135.5 },
      { name: "Kanagawa", lat: 35.4, lon: 139.4 },
      { name: "Aichi", lat: 35.1, lon: 137.0 },
      { name: "Saitama", lat: 35.8, lon: 139.6 },
      { name: "Chiba", lat: 35.6, lon: 140.1 },
      { name: "Hyogo", lat: 34.6, lon: 134.9 },
      { name: "Fukuoka", lat: 33.5, lon: 130.5 },
      { name: "Hokkaido", lat: 43.0, lon: 142.8 },
      { name: "Kyoto", lat: 35.0, lon: 135.7 },
      { name: "Hiroshima", lat: 34.3, lon: 132.4 },
      { name: "Miyagi", lat: 38.2, lon: 140.8 },
      { name: "Shizuoka", lat: 34.9, lon: 138.3 },
      { name: "Ibaraki", lat: 36.3, lon: 140.4 },
      { name: "Nagano", lat: 36.6, lon: 138.1 },
      { name: "Tochigi", lat: 36.5, lon: 139.8 },
      { name: "Gunma", lat: 36.4, lon: 139.0 },
      { name: "Okayama", lat: 34.6, lon: 133.9 },
      { name: "Fukushima", lat: 37.5, lon: 140.4 },
      { name: "Niigata", lat: 37.9, lon: 139.0 },
      { name: "Mie", lat: 34.7, lon: 136.5 },
      { name: "Kumamoto", lat: 32.7, lon: 130.7 },
      { name: "Kagoshima", lat: 31.5, lon: 130.5 },
      { name: "Okinawa", lat: 26.2, lon: 127.6 },
      { name: "Nagasaki", lat: 32.7, lon: 129.8 },
      { name: "Shiga", lat: 35.2, lon: 136.0 },
      { name: "Nara", lat: 34.6, lon: 135.8 },
      { name: "Yamaguchi", lat: 34.1, lon: 131.4 },
      { name: "Ehime", lat: 33.8, lon: 132.7 },
      { name: "Gifu", lat: 35.4, lon: 136.7 },
      { name: "Oita", lat: 33.2, lon: 131.5 },
      { name: "Iwate", lat: 39.6, lon: 141.1 },
      { name: "Aomori", lat: 40.8, lon: 140.7 },
      { name: "Yamagata", lat: 38.2, lon: 140.3 },
      { name: "Akita", lat: 39.7, lon: 140.1 },
      { name: "Ishikawa", lat: 36.5, lon: 136.6 },
      { name: "Wakayama", lat: 34.2, lon: 135.1 },
      { name: "Tokushima", lat: 34.0, lon: 134.5 },
      { name: "Kochi", lat: 33.5, lon: 133.5 },
      { name: "Kagawa", lat: 34.3, lon: 134.0 },
      { name: "Shimane", lat: 35.4, lon: 132.4 },
      { name: "Tottori", lat: 35.5, lon: 133.9 },
      { name: "Fukui", lat: 36.0, lon: 136.2 },
      { name: "Toyama", lat: 36.7, lon: 137.2 },
      { name: "Saga", lat: 33.2, lon: 130.3 },
      { name: "Miyazaki", lat: 31.9, lon: 131.4 },
      { name: "Yamanashi", lat: 35.6, lon: 138.5 },
    ],
  },
  AE: {
    name: "UAE", flag: "🇦🇪", lat: 24, lon: 54, color: "#009900",
    bounds: { minLat: 18, maxLat: 30, minLon: 48, maxLon: 60 },
    states: [
      { name: "Dubai", lat: 25.2, lon: 55.2 },
      { name: "Abu Dhabi", lat: 24.4, lon: 54.3 },
      { name: "Sharjah", lat: 25.3, lon: 55.4 },
      { name: "Ajman", lat: 25.4, lon: 55.5 },
      { name: "Ras Al Khaimah", lat: 25.8, lon: 55.9 },
      { name: "Fujairah", lat: 25.1, lon: 56.3 },
      { name: "Umm Al Quwain", lat: 25.5, lon: 55.5 },
    ],
  },
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function latLonToVec3(lat: number, lon: number, radius = 1.02): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function latLonToSpherical(lat: number, lon: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return { phi, theta };
}

// ─────────────────────────────────────────────
// VERTEX & FRAGMENT SHADERS (Day/Night)
// ─────────────────────────────────────────────
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform vec3 sunDirection;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vec4 dayColor = texture2D(dayTexture, vUv);
    vec4 nightColor = texture2D(nightTexture, vUv);
    float d = dot(vNormal, sunDirection);
    float blend = smoothstep(-0.1, 0.15, d);
    gl_FragColor = mix(nightColor, dayColor, blend);
  }
`;

// ─────────────────────────────────────────────
// SUN DIRECTION
// ─────────────────────────────────────────────
function getSunDirection(): THREE.Vector3 {
  const now = new Date();
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
  const dayOfYear = Math.floor(
    (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
      Date.UTC(now.getUTCFullYear(), 0, 0)) / 86400000
  );
  const dec = -23.45 * Math.cos((2 * Math.PI * (dayOfYear + 10)) / 365) * (Math.PI / 180);
  const sunLon = ((12 - utcHours) / 24) * Math.PI * 2;
  return new THREE.Vector3(
    Math.cos(dec) * Math.sin(sunLon),
    Math.sin(dec),
    Math.cos(dec) * Math.cos(sunLon)
  ).normalize();
}

// ─────────────────────────────────────────────
// GLOBE MESH
// ─────────────────────────────────────────────
function GlobeMesh({
  onCountryClick,
}: {
  onCountryClick: (countryKey: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const sunDir = useMemo(() => getSunDirection(), []);

  const [dayTex, nightTex] = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return [loader.load("/earth-day.jpg"), loader.load("/earth-night.jpg")];
  }, []);

  const shaderMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          dayTexture: { value: dayTex },
          nightTexture: { value: nightTex },
          sunDirection: { value: sunDir },
        },
        vertexShader,
        fragmentShader,
      }),
    [dayTex, nightTex, sunDir]
  );

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.05;
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    const uv = e.uv;
    if (!uv) return;
    const lon = uv.x * 360 - 180;
    const lat = uv.y * 180 - 90;
    for (const [key, c] of Object.entries(COUNTRIES)) {
      const b = c.bounds;
      if (lat >= b.minLat && lat <= b.maxLat && lon >= b.minLon && lon <= b.maxLon) {
        onCountryClick(key);
        return;
      }
    }
  };

  return (
    <mesh ref={meshRef} onClick={handleClick}>
      <sphereGeometry args={[1, 64, 64]} />
      <primitive object={shaderMat} attach="material" />
    </mesh>
  );
}

// ─────────────────────────────────────────────
// COUNTRY DOTS ON GLOBE
// ─────────────────────────────────────────────
function CountryDots({ onCountryClick }: { onCountryClick: (k: string) => void }) {
  return (
    <>
      {Object.entries(COUNTRIES).map(([key, c]) => {
        const pos = latLonToVec3(c.lat, c.lon);
        return (
          <mesh key={key} position={pos} onClick={(e) => { e.stopPropagation(); onCountryClick(key); }}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshStandardMaterial color={c.color} emissive={c.color} emissiveIntensity={0.8} />
            <Html distanceFactor={4} style={{ pointerEvents: "none" }}>
              <div style={{
                background: "rgba(0,0,0,0.7)",
                color: "#fff",
                padding: "2px 6px",
                borderRadius: 4,
                fontSize: 10,
                whiteSpace: "nowrap",
                border: `1px solid ${c.color}`,
              }}>
                {c.flag} {c.name}
              </div>
            </Html>
          </mesh>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────
// CAMERA ANIMATION HOOK
// ─────────────────────────────────────────────
function CameraAnimator({
  targetPos,
  targetLookAt,
  onDone,
}: {
  targetPos: THREE.Vector3 | null;
  targetLookAt: THREE.Vector3;
  onDone: () => void;
}) {
  const { camera } = useThree();
  const done = useRef(false);

  useEffect(() => {
    done.current = false;
  }, [targetPos]);

  useFrame(() => {
    if (!targetPos || done.current) return;
    camera.position.lerp(targetPos, 0.04);
    const dist = camera.position.distanceTo(targetPos);
    if (dist < 0.01) {
      camera.position.copy(targetPos);
      done.current = true;
      onDone();
    }
  });

  return null;
}

// ─────────────────────────────────────────────
// STATE DOTS (shown after zoom)
// ─────────────────────────────────────────────
function StateDots({
  countryKey,
  onStateClick,
}: {
  countryKey: string;
  onStateClick: (state: string) => void;
}) {
  const country = COUNTRIES[countryKey];
  if (!country) return null;

  return (
    <>
      {country.states.map((s) => {
        const pos = latLonToVec3(s.lat, s.lon, 1.025);
        return (
          <mesh
            key={s.name}
            position={pos}
            onClick={(e) => { e.stopPropagation(); onStateClick(s.name); }}
          >
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshStandardMaterial
              color={country.color}
              emissive={country.color}
              emissiveIntensity={1.2}
            />
            <Html distanceFactor={3} style={{ pointerEvents: "none" }}>
              <div style={{
                background: "rgba(0,0,0,0.75)",
                color: "#fff",
                padding: "2px 5px",
                borderRadius: 4,
                fontSize: 9,
                whiteSpace: "nowrap",
                border: `1px solid ${country.color}`,
                cursor: "pointer",
              }}>
                📍 {s.name}
              </div>
            </Html>
          </mesh>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────
// SCENE
// ─────────────────────────────────────────────
function Scene({
  mode,
  selectedCountry,
  onCountryClick,
  onStateClick,
  onZoomDone,
  zoomTarget,
}: {
  mode: "globe" | "zooming" | "country";
  selectedCountry: string | null;
  onCountryClick: (k: string) => void;
  onStateClick: (s: string) => void;
  onZoomDone: () => void;
  zoomTarget: THREE.Vector3 | null;
}) {
  const globeAutoRotate = mode === "globe";

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={1} />
      <pointLight position={[-5, -3, -5]} intensity={0.2} />

      <GlobeMesh onCountryClick={onCountryClick} />

      {mode === "globe" && <CountryDots onCountryClick={onCountryClick} />}
      {mode === "country" && selectedCountry && (
        <StateDots countryKey={selectedCountry} onStateClick={onStateClick} />
      )}

      <CameraAnimator
        targetPos={zoomTarget}
        targetLookAt={new THREE.Vector3(0, 0, 0)}
        onDone={onZoomDone}
      />

      <OrbitControls
        enablePan={false}
        minDistance={mode === "country" ? 1.3 : 2}
        maxDistance={mode === "globe" ? 4 : 2.5}
        autoRotate={globeAutoRotate}
        autoRotateSpeed={0.4}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// BREADCRUMB
// ─────────────────────────────────────────────
function Breadcrumb({
  mode,
  selectedCountry,
  selectedState,
  onBack,
}: {
  mode: "globe" | "zooming" | "country";
  selectedCountry: string | null;
  selectedState: string | null;
  onBack: () => void;
}) {
  if (mode === "globe") return null;
  const country = selectedCountry ? COUNTRIES[selectedCountry] : null;

  return (
    <div style={{
      position: "absolute",
      top: 20,
      left: 20,
      display: "flex",
      alignItems: "center",
      gap: 8,
      zIndex: 100,
    }}>
      <button
        onClick={onBack}
        style={{
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.25)",
          color: "#fff",
          padding: "8px 16px",
          borderRadius: 999,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 6,
          transition: "all 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
      >
        ← Back
      </button>

      <div style={{
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "rgba(255,255,255,0.8)",
        padding: "8px 14px",
        borderRadius: 999,
        fontSize: 12,
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}>
        🌍 Globe
        {country && (
          <>
            <span style={{ opacity: 0.4 }}> › </span>
            <span>{country.flag} {country.name}</span>
          </>
        )}
        {selectedState && (
          <>
            <span style={{ opacity: 0.4 }}> › </span>
            <span>📍 {selectedState}</span>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ZOOM LOADING OVERLAY
// ─────────────────────────────────────────────
function ZoomingOverlay({ country }: { country: string | null }) {
  const c = country ? COUNTRIES[country] : null;
  if (!c) return null;
  return (
    <div style={{
      position: "absolute",
      bottom: 40,
      left: "50%",
      transform: "translateX(-50%)",
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(16px)",
      border: `1px solid ${c.color}40`,
      color: "#fff",
      padding: "12px 28px",
      borderRadius: 999,
      fontSize: 14,
      fontWeight: 500,
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      gap: 10,
      animation: "fadeIn 0.4s ease",
    }}>
      <span style={{ fontSize: 20 }}>{c.flag}</span>
      Zooming into {c.name}...
      <span style={{
        width: 16, height: 16,
        border: "2px solid rgba(255,255,255,0.3)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        display: "inline-block",
        animation: "spin 0.8s linear infinite",
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────
export default function Globe() {
  const [mode, setMode] = useState<"globe" | "zooming" | "country">("globe");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [zoomTarget, setZoomTarget] = useState<THREE.Vector3 | null>(null);

  const handleCountryClick = (key: string) => {
    const c = COUNTRIES[key];
    if (!c) return;
    setSelectedCountry(key);
    setMode("zooming");

    // Camera target: pull in toward country center
    const { phi, theta } = latLonToSpherical(c.lat, c.lon);
    const r = 1.9; // zoom distance
    const target = new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
    setZoomTarget(target);
  };

  const handleZoomDone = () => {
    setMode("country");
  };

  const handleStateClick = (state: string) => {
    setSelectedState(state);
    // TODO: open job page
    alert(`Opening jobs for ${state}!`); // Replace with your job page component
  };

  const handleBack = () => {
    if (mode === "country") {
      setMode("globe");
      setSelectedCountry(null);
      setSelectedState(null);
      setZoomTarget(new THREE.Vector3(0, 0, 3));
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000010", position: "relative" }}>
      {/* Title */}
      <div style={{
        position: "absolute",
        top: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        textAlign: "center",
        pointerEvents: "none",
      }}>
        <h1 style={{
          color: "#fff",
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: 3,
          margin: 0,
          textShadow: "0 0 30px rgba(255,255,255,0.3)",
        }}>
          🌍 GlobalJobMap
        </h1>
        {mode === "globe" && (
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "4px 0 0" }}>
            Click any country to explore jobs
          </p>
        )}
        {mode === "country" && selectedCountry && (
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "4px 0 0" }}>
            Click a state/region to view jobs
          </p>
        )}
      </div>

      {/* Breadcrumb & Back */}
      <Breadcrumb
        mode={mode}
        selectedCountry={selectedCountry}
        selectedState={selectedState}
        onBack={handleBack}
      />

      {/* Zooming overlay */}
      {mode === "zooming" && <ZoomingOverlay country={selectedCountry} />}

      {/* Canvas */}
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <Scene
          mode={mode}
          selectedCountry={selectedCountry}
          onCountryClick={handleCountryClick}
          onStateClick={handleStateClick}
          onZoomDone={handleZoomDone}
          zoomTarget={zoomTarget}
        />
      </Canvas>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      `}</style>
    </div>
  );
}