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

// Enhanced Earth component with better visibility for both themes
const Earth: React.FC<{ theme: "dark" | "light" }> = ({ theme }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const context = canvas.getContext("2d");

    if (context) {
      // Create ocean gradient - optimized for both themes
      const oceanGradient = context.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height
      );
      if (theme === "dark") {
        // Brighter ocean colors for dark mode
        oceanGradient.addColorStop(0, "#1e40af");
        oceanGradient.addColorStop(0.3, "#1d4ed8");
        oceanGradient.addColorStop(0.5, "#2563eb");
        oceanGradient.addColorStop(0.7, "#3b82f6");
        oceanGradient.addColorStop(1, "#1e40af");
      } else {
        // Enhanced light mode ocean with better contrast
        oceanGradient.addColorStop(0, "#0c4a6e");
        oceanGradient.addColorStop(0.2, "#075985");
        oceanGradient.addColorStop(0.4, "#0369a1");
        oceanGradient.addColorStop(0.6, "#0284c7");
        oceanGradient.addColorStop(0.8, "#0ea5e9");
        oceanGradient.addColorStop(1, "#38bdf8");
      }

      context.fillStyle = oceanGradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Add continents with theme-appropriate colors
      const landColor = theme === "dark" ? "#22c55e" : "#059669"; // Rich green for both themes
      context.fillStyle = landColor;

      // Simplified continent shapes for better performance and visibility
      const continents = [
        // North America
        { x: 0.15, y: 0.25, w: 0.2, h: 0.3 },
        // South America
        { x: 0.25, y: 0.55, w: 0.1, h: 0.25 },
        // Europe
        { x: 0.45, y: 0.2, w: 0.08, h: 0.15 },
        // Africa
        { x: 0.45, y: 0.35, w: 0.12, h: 0.3 },
        // Asia
        { x: 0.65, y: 0.15, w: 0.25, h: 0.4 },
        // Australia
        { x: 0.8, y: 0.65, w: 0.12, h: 0.15 },
        // Greenland
        { x: 0.3, y: 0.1, w: 0.06, h: 0.08 },
      ];

      continents.forEach((cont) => {
        const x = cont.x * canvas.width;
        const y = cont.y * canvas.height;
        const w = cont.w * canvas.width;
        const h = cont.h * canvas.height;

        context.beginPath();
        context.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
        context.fill();

        // Add coastal variation for more realistic look
        if (theme === "dark") {
          context.fillStyle = "#16a34a"; // Slightly different green for variation
          for (let i = 0; i < 3; i++) {
            const vx = x + Math.random() * w;
            const vy = y + Math.random() * h;
            const vr = Math.random() * 20 + 5;
            context.beginPath();
            context.arc(vx, vy, vr, 0, 2 * Math.PI);
            context.fill();
          }
          context.fillStyle = landColor; // Reset to main land color
        } else {
          // Light theme coastal details
          context.fillStyle = "#047857"; // Darker green for contrast
          for (let i = 0; i < 4; i++) {
            const vx = x + Math.random() * w;
            const vy = y + Math.random() * h;
            const vr = Math.random() * 25 + 8;
            context.beginPath();
            context.arc(vx, vy, vr, 0, 2 * Math.PI);
            context.fill();
          }
          context.fillStyle = landColor; // Reset to main land color
        }
      });

      // Add atmospheric effects for both themes
      if (theme === "dark") {
        // Dark mode glow effect
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
        // Light mode atmospheric effect
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

        // Add subtle cloud patterns for light mode
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

    return new THREE.CanvasTexture(canvas);
  }, [theme]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.02; // Slower rotation
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 64, 32]}>
      <meshStandardMaterial
        map={texture}
        transparent
        opacity={theme === "dark" ? 0.95 : 0.92}
        roughness={theme === "dark" ? 0.6 : 0.7}
        metalness={theme === "dark" ? 0.2 : 0.15}
        emissive={
          theme === "dark"
            ? new THREE.Color("#001122")
            : new THREE.Color("#000308")
        }
        emissiveIntensity={theme === "dark" ? 0.1 : 0.05}
      />
    </Sphere>
  );
};

// Enhanced Exchange marker component
const ExchangeMarker: React.FC<{
  exchange: ExchangeLocation;
  isFiltered: boolean;
  onClick: (exchange: ExchangeLocation) => void;
  onHover: (exchange: ExchangeLocation | null) => void;
}> = ({ exchange, isFiltered, onClick, onHover }) => {
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

  useFrame((state) => {
    if (meshRef.current) {
      const scale = hovered ? 1.3 : 1;
      meshRef.current.scale.setScalar(scale);
      meshRef.current.rotation.y = state.clock.elapsedTime * (hovered ? 4 : 2);

      // Add pulsing effect
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.1 + 1;
      meshRef.current.scale.multiplyScalar(pulse);
    }
  });

  if (!isFiltered) return null;

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
        <boxGeometry args={[0.025, 0.025, 0.025]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.5 : 0.3}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

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

      {/* Text label */}
      {hovered && (
        <Billboard position={[0, 0.08, 0]}>
          <Text
            fontSize={0.025}
            color={color}
            anchorX="center"
            anchorY="bottom"
            outlineWidth={theme === "dark" ? 0.002 : 0.003}
            outlineColor={theme === "dark" ? "#000000" : "#ffffff"}
          >
            {exchange.displayName}
            {"\n"}
            <Text
              fontSize={0.015}
              color={theme === "dark" ? "#ffffff" : "#1f2937"}
              outlineWidth={theme === "dark" ? 0.001 : 0.002}
              outlineColor={theme === "dark" ? "#000000" : "#ffffff"}
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
      <Earth theme={theme} />

      {/* Exchange markers */}
      {filteredExchanges.map((exchange) => (
        <ExchangeMarker
          key={exchange.id}
          exchange={exchange}
          isFiltered={true}
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

// Main Map3D component
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
