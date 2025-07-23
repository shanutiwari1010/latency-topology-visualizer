"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Sphere,
  Line,
  Text,
  Billboard,
  Stars,
} from "@react-three/drei";
import * as THREE from "three";
import type {
  ExchangeLocation,
  LatencyConnection,
  FilterOptions,
  VisualizationSettings,
} from "@/types";

import {
  EXCHANGE_LOCATIONS,
  PROVIDER_COLORS,
  LATENCY_QUALITY_COLORS,
  LATENCY_THRESHOLDS,
} from "@/constants/exchangeLocations";

interface Map3DProps {
  exchanges: ExchangeLocation[];
  connections: LatencyConnection[];
  filters: FilterOptions;
  visualizationSettings: VisualizationSettings;
  theme: "dark" | "light";
  mapStyle?: "realistic" | "neon" | "minimal";
  onExchangeClick?: (exchange: ExchangeLocation) => void;
  onExchangeHover?: (exchange: ExchangeLocation | null) => void;
}

// Convert lat/lng to 3D coordinates on a sphere
const latLngToVector3 = (lat: number, lng: number, radius: number = 1) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

// Get latency quality based on value
const getLatencyQuality = (
  latency: number
): "excellent" | "good" | "fair" | "poor" => {
  if (latency <= LATENCY_THRESHOLDS.excellent) return "excellent";
  if (latency <= LATENCY_THRESHOLDS.good) return "good";
  if (latency <= LATENCY_THRESHOLDS.fair) return "fair";
  return "poor";
};

// Enhanced Earth component with multiple map styles
const Earth: React.FC<{
  theme: "dark" | "light";
  mapStyle?: "realistic" | "neon" | "minimal";
}> = ({ theme, mapStyle }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  console.log(mapStyle, "mapstyle");

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const context = canvas.getContext("2d");

    if (context) {
      // Create style-specific ocean gradients
      const oceanGradient = context.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height
      );

      if (mapStyle === "neon") {
        // Neon style - bright, electric colors
        if (theme === "dark") {
          oceanGradient.addColorStop(0, "#0a0a23");
          oceanGradient.addColorStop(0.3, "#1a0d4d");
          oceanGradient.addColorStop(0.5, "#2d1b69");
          oceanGradient.addColorStop(0.7, "#4338ca");
          oceanGradient.addColorStop(1, "#6366f1");
        } else {
          oceanGradient.addColorStop(0, "#312e81");
          oceanGradient.addColorStop(0.3, "#4338ca");
          oceanGradient.addColorStop(0.5, "#6366f1");
          oceanGradient.addColorStop(0.7, "#8b5cf6");
          oceanGradient.addColorStop(1, "#a855f7");
        }
      } else if (mapStyle === "minimal") {
        // Minimal style - muted, clean colors
        if (theme === "dark") {
          oceanGradient.addColorStop(0, "#374151");
          oceanGradient.addColorStop(0.5, "#4b5563");
          oceanGradient.addColorStop(1, "#6b7280");
        } else {
          oceanGradient.addColorStop(0, "#e5e7eb");
          oceanGradient.addColorStop(0.5, "#d1d5db");
          oceanGradient.addColorStop(1, "#9ca3af");
        }
      } else {
        // Realistic style - natural colors (existing implementation)
        if (theme === "dark") {
          oceanGradient.addColorStop(0, "#1e40af");
          oceanGradient.addColorStop(0.3, "#1d4ed8");
          oceanGradient.addColorStop(0.5, "#2563eb");
          oceanGradient.addColorStop(0.7, "#3b82f6");
          oceanGradient.addColorStop(1, "#1e40af");
        } else {
          oceanGradient.addColorStop(0, "#0c4a6e");
          oceanGradient.addColorStop(0.2, "#075985");
          oceanGradient.addColorStop(0.4, "#0369a1");
          oceanGradient.addColorStop(0.6, "#0284c7");
          oceanGradient.addColorStop(0.8, "#0ea5e9");
          oceanGradient.addColorStop(1, "#38bdf8");
        }
      }

      context.fillStyle = oceanGradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Add continents with style-specific colors
      let landColor: string;
      let coastalColor: string;

      if (mapStyle === "neon") {
        landColor = theme === "dark" ? "#00ff88" : "#10b981";
        coastalColor = theme === "dark" ? "#00cc6a" : "#059669";
      } else if (mapStyle === "minimal") {
        landColor = theme === "dark" ? "#9ca3af" : "#6b7280";
        coastalColor = theme === "dark" ? "#6b7280" : "#4b5563";
      } else {
        landColor = theme === "dark" ? "#22c55e" : "#059669";
        coastalColor = theme === "dark" ? "#16a34a" : "#047857";
      }

      context.fillStyle = landColor;

      // Simplified continent shapes
      const continents = [
        { x: 0.15, y: 0.25, w: 0.2, h: 0.3 }, // North America
        { x: 0.25, y: 0.55, w: 0.1, h: 0.25 }, // South America
        { x: 0.45, y: 0.2, w: 0.08, h: 0.15 }, // Europe
        { x: 0.45, y: 0.35, w: 0.12, h: 0.3 }, // Africa
        { x: 0.65, y: 0.15, w: 0.25, h: 0.4 }, // Asia
        { x: 0.8, y: 0.65, w: 0.12, h: 0.15 }, // Australia
        { x: 0.3, y: 0.1, w: 0.06, h: 0.08 }, // Greenland
      ];

      continents.forEach((cont) => {
        const x = cont.x * canvas.width;
        const y = cont.y * canvas.height;
        const w = cont.w * canvas.width;
        const h = cont.h * canvas.height;

        context.beginPath();
        context.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
        context.fill();

        // Add coastal variation (reduced for minimal style)
        if (mapStyle !== "minimal") {
          context.fillStyle = coastalColor;
          const detailCount = mapStyle === "neon" ? 5 : 4;
          for (let i = 0; i < detailCount; i++) {
            const vx = x + Math.random() * w;
            const vy = y + Math.random() * h;
            const vr = Math.random() * (mapStyle === "neon" ? 30 : 25) + 8;
            context.beginPath();
            context.arc(vx, vy, vr, 0, 2 * Math.PI);
            context.fill();
          }
          context.fillStyle = landColor;
        }
      });

      // Add style-specific atmospheric effects
      if (mapStyle === "neon") {
        // Neon glow effect
        const neonGradient = context.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          0,
          canvas.width / 2,
          canvas.height / 2,
          canvas.width / 2
        );
        neonGradient.addColorStop(0, "rgba(99, 102, 241, 0.2)");
        neonGradient.addColorStop(0.7, "rgba(147, 51, 234, 0.1)");
        neonGradient.addColorStop(1, "rgba(236, 72, 153, 0.3)");

        context.fillStyle = neonGradient;
        context.globalCompositeOperation = "screen";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.globalCompositeOperation = "source-over";

        // Add neon grid lines
        context.strokeStyle = "rgba(0, 255, 136, 0.3)";
        context.lineWidth = 2;
        context.setLineDash([10, 5]);

        // Latitude lines
        for (let i = 1; i < 4; i++) {
          const y = (canvas.height / 4) * i;
          context.beginPath();
          context.moveTo(0, y);
          context.lineTo(canvas.width, y);
          context.stroke();
        }

        // Longitude lines
        for (let i = 1; i < 8; i++) {
          const x = (canvas.width / 8) * i;
          context.beginPath();
          context.moveTo(x, 0);
          context.lineTo(x, canvas.height);
          context.stroke();
        }

        context.setLineDash([]); // Reset line dash
      } else if (mapStyle === "realistic") {
        // Realistic atmospheric effects (existing implementation)
        if (theme === "dark") {
          const glowGradient = context.createRadialGradient(
            canvas.width / 2,
            canvas.height / 2,
            0,
            canvas.width / 2,
            canvas.height / 2,
            canvas.width / 2
          );
          glowGradient.addColorStop(0, "rgba(59, 130, 246, 0.1)");
          glowGradient.addColorStop(0.7, "rgba(59, 130, 246, 0.05)");
          glowGradient.addColorStop(1, "rgba(59, 130, 246, 0.2)");

          context.fillStyle = glowGradient;
          context.globalCompositeOperation = "screen";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.globalCompositeOperation = "source-over";
        } else {
          const lightGradient = context.createRadialGradient(
            canvas.width / 2,
            canvas.height / 2,
            0,
            canvas.width / 2,
            canvas.height / 2,
            canvas.width / 2
          );
          lightGradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
          lightGradient.addColorStop(0.6, "rgba(255, 255, 255, 0.05)");
          lightGradient.addColorStop(1, "rgba(14, 165, 233, 0.1)");

          context.fillStyle = lightGradient;
          context.globalCompositeOperation = "overlay";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.globalCompositeOperation = "source-over";

          // Add cloud patterns
          context.fillStyle = "rgba(255, 255, 255, 0.15)";
          for (let i = 0; i < 15; i++) {
            const cx = Math.random() * canvas.width;
            const cy = Math.random() * canvas.height;
            const radius = Math.random() * 80 + 40;
            context.beginPath();
            context.arc(cx, cy, radius, 0, 2 * Math.PI);
            context.fill();
          }
        }
      }
      // Minimal style has no additional effects for clean look
    }

    return new THREE.CanvasTexture(canvas);
  }, [theme, mapStyle]);

  useFrame((state) => {
    if (meshRef.current) {
      // Adjust rotation speed based on style
      const rotationSpeed =
        mapStyle === "neon" ? 0.03 : mapStyle === "minimal" ? 0.01 : 0.02;
      meshRef.current.rotation.y = state.clock.elapsedTime * rotationSpeed;
    }
  });

  // Style-specific material properties
  const getMaterialProps = () => {
    if (mapStyle === "neon") {
      return {
        opacity: 0.98,
        roughness: 0.2,
        metalness: 0.8,
        emissive:
          theme === "dark"
            ? new THREE.Color("#001133")
            : new THREE.Color("#000022"),
        emissiveIntensity: 0.3,
      };
    } else if (mapStyle === "minimal") {
      return {
        opacity: 0.85,
        roughness: 0.9,
        metalness: 0.0,
        emissive: new THREE.Color("#000000"),
        emissiveIntensity: 0,
      };
    } else {
      return {
        opacity: theme === "dark" ? 0.95 : 0.92,
        roughness: theme === "dark" ? 0.6 : 0.7,
        metalness: theme === "dark" ? 0.2 : 0.15,
        emissive:
          theme === "dark"
            ? new THREE.Color("#001122")
            : new THREE.Color("#000308"),
        emissiveIntensity: theme === "dark" ? 0.1 : 0.05,
      };
    }
  };

  const materialProps = getMaterialProps();

  return (
    <Sphere ref={meshRef} args={[1, 64, 32]}>
      <meshStandardMaterial map={texture} transparent {...materialProps} />
    </Sphere>
  );
};

// Enhanced Exchange marker component with style variations
const ExchangeMarker: React.FC<{
  exchange: ExchangeLocation;
  isFiltered: boolean;
  mapStyle?: "realistic" | "neon" | "minimal";
  onClick: (exchange: ExchangeLocation) => void;
  onHover: (exchange: ExchangeLocation | null) => void;
}> = ({ exchange, isFiltered, mapStyle, onClick, onHover }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const position = useMemo(
    () =>
      latLngToVector3(
        exchange.coordinates.latitude,
        exchange.coordinates.longitude,
        1.05
      ),
    [exchange.coordinates]
  );

  const color = PROVIDER_COLORS[exchange.cloudProvider];

  // Style-specific marker properties
  const getMarkerProps = () => {
    if (mapStyle === "neon") {
      return {
        size: 0.03,
        geometry: "octahedron" as const,
        emissiveIntensity: hovered ? 0.8 : 0.5,
        roughness: 0.1,
        metalness: 0.9,
      };
    } else if (mapStyle === "minimal") {
      return {
        size: 0.02,
        geometry: "sphere" as const,
        emissiveIntensity: 0,
        roughness: 0.8,
        metalness: 0.2,
      };
    } else {
      return {
        size: 0.025,
        geometry: "box" as const,
        emissiveIntensity: hovered ? 0.5 : 0.3,
        roughness: 0.3,
        metalness: 0.7,
      };
    }
  };

  const markerProps = getMarkerProps();

  useFrame((state) => {
    if (meshRef.current) {
      const scale = hovered ? 1.3 : 1;
      meshRef.current.scale.setScalar(scale);

      // Style-specific animations
      if (mapStyle === "neon") {
        meshRef.current.rotation.y =
          state.clock.elapsedTime * (hovered ? 6 : 3);
        meshRef.current.rotation.x = state.clock.elapsedTime * 2;
        // Neon pulsing effect
        const pulse = Math.sin(state.clock.elapsedTime * 4) * 0.2 + 1;
        meshRef.current.scale.multiplyScalar(pulse);
      } else if (mapStyle === "minimal") {
        // Minimal style has subtle animations
        const subtlePulse = Math.sin(state.clock.elapsedTime * 2) * 0.05 + 1;
        meshRef.current.scale.multiplyScalar(subtlePulse);
      } else {
        // Realistic style
        meshRef.current.rotation.y =
          state.clock.elapsedTime * (hovered ? 4 : 2);
        const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.1 + 1;
        meshRef.current.scale.multiplyScalar(pulse);
      }
    }
  });

  if (!isFiltered) return null;

  const renderGeometry = () => {
    switch (markerProps.geometry) {
      case "octahedron":
        return <octahedronGeometry args={[markerProps.size, 0]} />;
      case "sphere":
        return <sphereGeometry args={[markerProps.size, 8, 6]} />;
      default:
        return (
          <boxGeometry
            args={[markerProps.size, markerProps.size, markerProps.size]}
          />
        );
    }
  };

  return (
    <group position={position}>
      {/* Main marker */}
      <mesh
        ref={meshRef}
        onClick={() => onClick(exchange)}
        onPointerOver={() => {
          setHovered(true);
          onHover(exchange);
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover(null);
        }}
      >
        {renderGeometry()}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={markerProps.emissiveIntensity}
          roughness={markerProps.roughness}
          metalness={markerProps.metalness}
        />
      </mesh>

      {/* Style-specific effects */}
      {mapStyle === "neon" && (
        <>
          {/* Neon ring effect */}
          <mesh position={[0, 0, 0]}>
            <ringGeometry args={[0.025, 0.035, 16]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={hovered ? 0.8 : 0.4}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Outer glow ring */}
          <mesh position={[0, 0, 0]}>
            <ringGeometry args={[0.035, 0.05, 16]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={hovered ? 0.4 : 0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}

      {mapStyle === "realistic" && (
        <>
          {/* Glowing ring around marker */}
          <mesh position={[0, 0, 0]}>
            <ringGeometry args={[0.02, 0.03, 16]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={hovered ? 0.6 : 0.3}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Status indicator */}
          <mesh position={[0, 0.04, 0]}>
            <sphereGeometry args={[0.005, 8, 6]} />
            <meshBasicMaterial
              color={
                exchange.status === "online"
                  ? "#10b981"
                  : exchange.status === "maintenance"
                  ? "#f59e0b"
                  : "#ef4444"
              }
            />
          </mesh>
        </>
      )}

      {/* Minimal style has no extra effects for clean look */}

      {/* Text label with style-appropriate styling */}
      {hovered && (
        <Billboard position={[0, 0.08, 0]}>
          <Text
            fontSize={mapStyle === "neon" ? 0.03 : 0.025}
            color={mapStyle === "neon" ? "#00ff88" : color}
            anchorX="center"
            anchorY="bottom"
            outlineWidth={mapStyle === "minimal" ? 0 : 0.003}
            outlineColor={mapStyle === "neon" ? "#000033" : "#000000"}
          >
            {exchange.displayName}
            {"\n"}
            <Text
              fontSize={mapStyle === "neon" ? 0.018 : 0.015}
              color={mapStyle === "neon" ? "#00ff88" : "#ffffff"}
              outlineWidth={mapStyle === "minimal" ? 0 : 0.002}
              outlineColor={mapStyle === "neon" ? "#000033" : "#000000"}
            >
              {exchange.region} • {exchange.status}
            </Text>
          </Text>
        </Billboard>
      )}
    </group>
  );
};

// Enhanced Animated latency connection
const LatencyConnection: React.FC<{
  connection: LatencyConnection;
  isVisible: boolean;
  animationSpeed: number;
}> = ({ connection, isVisible, animationSpeed }) => {
  const lineRef = useRef<THREE.Line>(null);
  const particleRef = useRef<THREE.Mesh>(null);
  const [animationProgress, setAnimationProgress] = useState(Math.random());

  const sourcePos = useMemo(
    () =>
      latLngToVector3(
        connection.source.coordinates.latitude,
        connection.source.coordinates.longitude,
        1.05
      ),
    [connection.source.coordinates]
  );

  const targetPos = useMemo(
    () =>
      latLngToVector3(
        connection.target.coordinates.latitude,
        connection.target.coordinates.longitude,
        1.05
      ),
    [connection.target.coordinates]
  );

  const curve = useMemo(() => {
    const midPoint = sourcePos.clone().add(targetPos).multiplyScalar(0.5);
    const distance = sourcePos.distanceTo(targetPos);
    const height = 1.1 + distance * 0.3; // Dynamic arc height based on distance
    midPoint.normalize().multiplyScalar(height);
    return new THREE.QuadraticBezierCurve3(sourcePos, midPoint, targetPos);
  }, [sourcePos, targetPos]);

  const quality = getLatencyQuality(connection.latency);
  const color = LATENCY_QUALITY_COLORS[quality];

  useFrame((state) => {
    if (!isVisible) return;

    const newProgress =
      (state.clock.elapsedTime * animationSpeed + animationProgress) % 1;
    setAnimationProgress(newProgress);

    if (particleRef.current) {
      const point = curve.getPoint(newProgress);
      particleRef.current.position.copy(point);

      // Fade particle at the end of the curve
      const material = particleRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = Math.sin(newProgress * Math.PI);
    }
  });

  if (!isVisible || !connection.isActive) return null;

  return (
    <group>
      {/* Connection line with gradient effect */}
      <Line
        ref={lineRef}
        points={curve.getPoints(50)}
        color={color}
        lineWidth={connection.latency > 100 ? 3 : 2}
        transparent
        opacity={0.7}
      />

      {/* Animated particle */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.006, 8, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>

      {/* Pulse effect for high latency */}
      {connection.latency > 100 && (
        <mesh position={curve.getPoint(0.5)}>
          <ringGeometry args={[0.01, 0.02, 8]} />
          <meshBasicMaterial
            color="#ff4444"
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

// Enhanced Cloud region visualization
const CloudRegion: React.FC<{
  region: {
    name: string;
    coordinates: { latitude: number; longitude: number };
    provider: string;
  };
  isVisible: boolean;
}> = ({ region, isVisible }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const position = useMemo(
    () =>
      latLngToVector3(
        region.coordinates.latitude,
        region.coordinates.longitude,
        1.08
      ),
    [region.coordinates]
  );

  const color =
    PROVIDER_COLORS[region.provider as keyof typeof PROVIDER_COLORS];

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.5;
      // Subtle pulsing
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1;
      meshRef.current.scale.setScalar(pulse);
    }
  });

  if (!isVisible) return null;

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <ringGeometry args={[0.04, 0.06, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner glow */}
      <mesh>
        <ringGeometry args={[0.02, 0.04, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

// Main 3D scene component
const Scene3D: React.FC<Map3DProps> = ({
  exchanges,
  connections,
  filters,
  visualizationSettings,
  theme,
  mapStyle,
  onExchangeClick,
  onExchangeHover,
}) => {
  // Filter exchanges based on current filters
  const filteredExchanges = useMemo(() => {
    return exchanges.filter((exchange) => {
      const exchangeMatch =
        filters.exchanges.length === 0 ||
        filters.exchanges.includes(exchange.name);
      const providerMatch =
        filters.cloudProviders.length === 0 ||
        filters.cloudProviders.includes(exchange.cloudProvider);
      return exchangeMatch && providerMatch;
    });
  }, [exchanges, filters]);

  // Filter connections based on current filters and latency range
  const filteredConnections = useMemo(() => {
    return connections.filter((connection) => {
      const latencyInRange =
        connection.latency >= filters.latencyRange.min &&
        connection.latency <= filters.latencyRange.max;
      const exchangesVisible =
        filteredExchanges.some((e) => e.id === connection.source.id) &&
        filteredExchanges.some((e) => e.id === connection.target.id);
      return latencyInRange && exchangesVisible && filters.showRealTime;
    });
  }, [connections, filters, filteredExchanges]);

  return (
    <>
      {/* Enhanced lighting system optimized for both themes */}
      <ambientLight intensity={theme === "dark" ? 0.4 : 0.6} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={theme === "dark" ? 1.2 : 1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight
        position={[-5, -5, -5]}
        intensity={theme === "dark" ? 0.8 : 0.7}
        color={theme === "dark" ? "#4f46e5" : "#f59e0b"}
      />

      {/* Theme-specific additional lighting */}
      {theme === "dark" ? (
        <>
          <pointLight position={[0, 0, 5]} intensity={0.3} color="#3b82f6" />
          <pointLight position={[0, 5, 0]} intensity={0.2} color="#8b5cf6" />
        </>
      ) : (
        <>
          <pointLight position={[3, 3, 3]} intensity={0.4} color="#fbbf24" />
          <pointLight position={[-3, 2, -3]} intensity={0.3} color="#06b6d4" />
          <directionalLight
            position={[-5, 10, 5]}
            intensity={0.6}
            color="#ffffff"
          />
        </>
      )}

      {/* Background elements */}
      {theme === "dark" ? (
        <Stars
          radius={300}
          depth={60}
          count={1000}
          factor={6}
          saturation={0.1}
          fade
          speed={0.5}
        />
      ) : (
        // Light mode atmospheric particles
        <group>
          {[...Array(50)].map((_, i) => (
            <mesh
              key={i}
              position={[
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50,
              ]}
            >
              <sphereGeometry args={[0.02, 4, 4]} />
              <meshBasicMaterial color="#e0f2fe" transparent opacity={0.1} />
            </mesh>
          ))}
        </group>
      )}

      {/* Earth */}
      <Earth theme={theme} mapStyle={mapStyle} />

      {/* Exchange markers */}
      {filteredExchanges.map((exchange) => (
        <ExchangeMarker
          key={exchange.id}
          exchange={exchange}
          isFiltered={true}
          mapStyle={mapStyle}
          onClick={onExchangeClick || (() => {})}
          onHover={onExchangeHover || (() => {})}
        />
      ))}

      {/* Latency connections */}
      {filteredConnections.map((connection) => (
        <LatencyConnection
          key={connection.id}
          connection={connection}
          isVisible={filters.showRealTime}
          animationSpeed={visualizationSettings.animationSpeed}
        />
      ))}

      {/* Enhanced Camera controls */}
      <OrbitControls
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        minDistance={1.5}
        maxDistance={8}
        autoRotate={false}
        autoRotateSpeed={0.2}
        dampingFactor={0.05}
        enableDamping={true}
        maxPolarAngle={Math.PI}
        minPolarAngle={0}
      />
    </>
  );
};

const Map3D: React.FC<Map3DProps> = (props) => {
  // Enhanced background colors for optimal contrast in both themes
  const backgroundColor = useMemo(() => {
    if (props.theme === "dark") {
      return "#000011"; // Very dark blue for dramatic contrast
    } else {
      return "#f8fafc"; // Light blue-gray with subtle tint
    }
  }, [props.theme]);

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 60 }}
        style={{ background: backgroundColor }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping:
            props.theme === "dark"
              ? THREE.ACESFilmicToneMapping
              : THREE.LinearToneMapping,
          toneMappingExposure: props.theme === "dark" ? 1.2 : 1.0,
        }}
        shadows={true}
      >
        <Scene3D {...props} />
      </Canvas>
    </div>
  );
};

export default Map3D;
