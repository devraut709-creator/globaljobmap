"use client";

import { useEffect, useState, useCallback } from "react";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface GeoFeature {
  type: string;
  properties: Record<string, any>;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: any;
  };
}

interface GeoJSON {
  type: string;
  features: GeoFeature[];
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const INDIA_BOUNDS = { minLat: 6, maxLat: 38, minLon: 65, maxLon: 100 };
const W = 800;
const H = 800;

function project(lon: number, lat: number): [number, number] {
  const x = ((lon - INDIA_BOUNDS.minLon) / (INDIA_BOUNDS.maxLon - INDIA_BOUNDS.minLon)) * W;
  const y = ((INDIA_BOUNDS.maxLat - lat) / (INDIA_BOUNDS.maxLat - INDIA_BOUNDS.minLat)) * H;
  return [x, y];
}

function ringToPath(ring: number[][]): string {
  return (
    ring
      .map((pt, i) => {
        const [x, y] = project(pt[0], pt[1]);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ") + " Z"
  );
}

function geometryToPath(geometry: GeoFeature["geometry"]): string {
  if (geometry.type === "Polygon") {
    return geometry.coordinates.map((ring: number[][]) => ringToPath(ring)).join(" ");
  } else if (geometry.type === "MultiPolygon") {
    return geometry.coordinates
      .map((poly: number[][][]) => poly.map((ring: number[][]) => ringToPath(ring)).join(" "))
      .join(" ");
  }
  return "";
}

function getCentroid(geometry: GeoFeature["geometry"]): [number, number] {
  let coords: number[][] = [];
  if (geometry.type === "Polygon") {
    coords = geometry.coordinates[0];
  } else if (geometry.type === "MultiPolygon") {
    // Use largest polygon
    let max = 0;
    for (const poly of geometry.coordinates) {
      if (poly[0].length > max) {
        max = poly[0].length;
        coords = poly[0];
      }
    }
  }
  if (!coords.length) return [0, 0];
  const avgLon = coords.reduce((s: number, p: number[]) => s + p[0], 0) / coords.length;
  const avgLat = coords.reduce((s: number, p: number[]) => s + p[1], 0) / coords.length;
  return project(avgLon, avgLat);
}

function getStateName(props: Record<string, any>): string {
  return (
    props.NAME_1 || props.ST_NM || props.name || props.NAME || props.statename || "Unknown"
  );
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
interface IndiaMapProps {
  onBack: () => void;
  onStateClick: (stateName: string) => void;
}

export default function IndiaMap({ onBack, onStateClick }: IndiaMapProps) {
  const [geoData, setGeoData] = useState<GeoJSON | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/india.geojson")
      .then((r) => r.json())
      .then((data) => {
        setGeoData(data);
        setTimeout(() => setVisible(true), 50);
      })
      .catch((err) => console.error("GeoJSON load error:", err));
  }, []);

  const handleBack = useCallback(() => {
    setVisible(false);
    setTimeout(onBack, 500);
  }, [onBack]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease",
      }}
    >
      {/* Stars background */}
      <div style={{
        position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none",
      }}>
        {Array.from({ length: 120 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              background: "#fff",
              borderRadius: "50%",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 28px",
        zIndex: 10,
      }}>
        {/* Back button */}
        <button
          onClick={handleBack}
          style={{
            background: "rgba(0,255,255,0.08)",
            border: "1px solid rgba(0,255,255,0.35)",
            color: "#00ffff",
            padding: "10px 22px",
            borderRadius: 999,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 1,
            transition: "all 0.2s",
            backdropFilter: "blur(8px)",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(0,255,255,0.18)";
            e.currentTarget.style.boxShadow = "0 0 16px rgba(0,255,255,0.4)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(0,255,255,0.08)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          ← Globe
        </button>

        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 2 }}>🇮🇳</div>
          <h2 style={{
            color: "#fff",
            margin: 0,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 3,
            textShadow: "0 0 20px rgba(0,255,255,0.5)",
          }}>
            INDIA
          </h2>
          <p style={{ color: "rgba(0,255,255,0.6)", margin: 0, fontSize: 11, letterSpacing: 2 }}>
            SELECT A STATE TO EXPLORE JOBS
          </p>
        </div>

        {/* Breadcrumb */}
        <div style={{
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.5)",
          padding: "10px 16px",
          borderRadius: 999,
          fontSize: 12,
          backdropFilter: "blur(8px)",
        }}>
          🌍 Globe &rsaquo; 🇮🇳 India
        </div>
      </div>

      {/* Hovered state name */}
      {hoveredState && (
        <div style={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.8)",
          border: "1px solid rgba(0,255,255,0.5)",
          color: "#00ffff",
          padding: "10px 24px",
          borderRadius: 999,
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: 2,
          zIndex: 10,
          backdropFilter: "blur(12px)",
          boxShadow: "0 0 20px rgba(0,255,255,0.3)",
          pointerEvents: "none",
        }}>
          📍 {hoveredState}
        </div>
      )}

      {/* Loading */}
      {!geoData && (
        <div style={{ color: "#00ffff", fontSize: 16, letterSpacing: 2 }}>
          Loading India map...
        </div>
      )}

      {/* SVG MAP */}
      {geoData && (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{
            width: "min(85vw, 85vh)",
            height: "min(85vw, 85vh)",
            marginTop: 80,
            filter: "drop-shadow(0 0 30px rgba(0,200,255,0.15))",
            cursor: "crosshair",
          }}
        >
          <defs>
            {/* Glow filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="strongGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {geoData.features.map((feature, idx) => {
            const name = getStateName(feature.properties);
            const path = geometryToPath(feature.geometry);
            const centroid = getCentroid(feature.geometry);
            const isHovered = hoveredState === name;

            return (
              <g key={idx}>
                <path
                  d={path}
                  fill={isHovered ? "rgba(0,255,255,0.15)" : "rgba(0,30,60,0.7)"}
                  stroke={isHovered ? "#00ffff" : "#0088aa"}
                  strokeWidth={isHovered ? 1.8 : 0.8}
                  filter={isHovered ? "url(#strongGlow)" : "url(#glow)"}
                  style={{ transition: "all 0.2s", cursor: "pointer" }}
                  onMouseEnter={() => setHoveredState(name)}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => onStateClick(name)}
                />
                {/* State name label */}
                <text
                  x={centroid[0]}
                  y={centroid[1]}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isHovered ? "#00ffff" : "rgba(255,255,255,0.65)"}
                  fontSize={isHovered ? 9 : 7.5}
                  fontWeight={isHovered ? 700 : 400}
                  style={{ pointerEvents: "none", transition: "all 0.2s", userSelect: "none" }}
                >
                  {name}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
