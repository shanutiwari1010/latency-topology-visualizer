"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Sphere,
  Line,
  Text,
  Billboard,
} from "@react-three/drei";
import * as THREE from "three";
// import { ExchangeLocation, LatencyConnection, FilterOptions, VisualizationSettings } from '@/types';
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

// Earth component
const Earth: React.FC<{ theme: "dark" | "light" }> = ({ theme }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext("2d");

    if (context) {
      const gradient = context.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height
      );
      if (theme === "dark") {
        gradient.addColorStop(0, "#0f172a");
        gradient.addColorStop(0.5, "#1e293b");
        gradient.addColorStop(1, "#0f172a");
      } else {
        gradient.addColorStop(0, "#e0f2fe");
        gradient.addColorStop(0.5, "#0284c7");
        gradient.addColorStop(1, "#0c4a6e");
      }

      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    return new THREE.CanvasTexture(canvas);
  }, [theme]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 64, 32]}>
      <meshStandardMaterial
        map={texture}
        transparent
        opacity={theme === "dark" ? 0.8 : 0.9}
        roughness={0.8}
        metalness={0.1}
        color="#0284c7"
      />
    </Sphere>
  );
};

// Exchange marker component
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
      const scale = hovered ? 1.2 : 1;
      meshRef.current.scale.setScalar(scale);
      meshRef.current.rotation.y = state.clock.elapsedTime * 2;
    }
  });

  if (!isFiltered) return null;

  return (
    <group position={position}>
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
        <boxGeometry args={[0.02, 0.02, 0.02]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>
      {hovered && (
        <Billboard position={[0, 0.1, 0]}>
          <Text fontSize={0.03} color={color} anchorX="center" anchorY="bottom">
            {exchange.displayName}
          </Text>
        </Billboard>
      )}
    </group>
  );
};

// Animated latency connection
const LatencyConnection: React.FC<{
  connection: LatencyConnection;
  isVisible: boolean;
  animationSpeed: number;
}> = ({ connection, isVisible, animationSpeed }) => {
  const lineRef = useRef<THREE.Line>(null);
  const particleRef = useRef<THREE.Mesh>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

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
    midPoint.normalize().multiplyScalar(1.3); // Arc height
    return new THREE.QuadraticBezierCurve3(sourcePos, midPoint, targetPos);
  }, [sourcePos, targetPos]);

  const quality = getLatencyQuality(connection.latency);
  const color = LATENCY_QUALITY_COLORS[quality];

  useFrame((state) => {
    if (!isVisible) return;

    const newProgress = (state.clock.elapsedTime * animationSpeed) % 1;
    setAnimationProgress(newProgress);

    if (particleRef.current) {
      const point = curve.getPoint(newProgress);
      particleRef.current.position.copy(point);
    }
  });

  if (!isVisible || !connection.isActive) return null;

  return (
    <group>
      {/* Connection line */}
      <Line
        ref={lineRef}
        points={curve.getPoints(50)}
        color={color}
        lineWidth={2}
        transparent
        opacity={0.6}
      />

      {/* Animated particle */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.005, 8, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
};

// Cloud region visualization
const CloudRegion: React.FC<{
  region: {
    name: string;
    coordinates: { latitude: number; longitude: number };
    provider: string;
  };
  isVisible: boolean;
}> = ({ region, isVisible }) => {
  const position = useMemo(
    () =>
      latLngToVector3(
        region.coordinates.latitude,
        region.coordinates.longitude,
        1.08
      ),
    [region.coordinates]
  );

  if (!isVisible) return null;

  return (
    <group position={position}>
      <mesh>
        <ringGeometry args={[0.03, 0.05, 16]} />
        <meshBasicMaterial
          color={
            PROVIDER_COLORS[region.provider as keyof typeof PROVIDER_COLORS]
          }
          transparent
          opacity={0.3}
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
      {/* Lighting */}
      <ambientLight intensity={theme === "dark" ? 0.3 : 0.5} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={theme === "dark" ? 0.8 : 1}
        castShadow
      />
      <pointLight position={[-5, -5, -5]} intensity={0.5} />

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

      {/* Camera controls */}
      <OrbitControls
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        minDistance={1.5}
        maxDistance={5}
        autoRotate={false}
        autoRotateSpeed={0.5}
      />
    </>
  );
};

// Main Map3D component
const Map3D: React.FC<Map3DProps> = (props) => {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 3], fov: 60 }}
        style={{ background: props.theme === "dark" ? "#000000" : "#f8fafc" }}
      >
        <Scene3D {...props} />
      </Canvas>
    </div>
  );
};

export default Map3D;
