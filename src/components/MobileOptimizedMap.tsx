"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { ExchangeLocation, LatencyConnection, FilterOptions } from "@/types";
import { OrbitControls as ThreeOrbitControls } from "three-stdlib";

interface MobileOptimizedMapProps {
  exchanges: ExchangeLocation[];
  connections: LatencyConnection[];
  filters: FilterOptions;
  theme: "dark" | "light";
  onExchangeClick?: (exchange: ExchangeLocation) => void;
}

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

function hasMemory(
  perf: Performance
): perf is Performance & { memory: PerformanceMemory } {
  return "memory" in perf;
}

// Performance-optimized camera controller for mobile
const MobileCameraControls: React.FC<{
  onCameraChange?: (position: THREE.Vector3, target: THREE.Vector3) => void;
}> = ({ onCameraChange }) => {
  const { camera, gl } = useThree();
  const controlsRef = useRef<ThreeOrbitControls>(null);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const handleTouchStart = () => setIsTouch(true);
    const handleTouchEnd = () => setIsTouch(false);

    gl.domElement.addEventListener("touchstart", handleTouchStart);
    gl.domElement.addEventListener("touchend", handleTouchEnd);

    return () => {
      gl.domElement.removeEventListener("touchstart", handleTouchStart);
      gl.domElement.removeEventListener("touchend", handleTouchEnd);
    };
  }, [gl.domElement]);

  useFrame(() => {
    if (controlsRef.current && onCameraChange) {
      onCameraChange(camera.position, controlsRef.current.target);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={true}
      enablePan={true}
      enableRotate={true}
      minDistance={1.2}
      maxDistance={4}
      autoRotate={!isTouch}
      autoRotateSpeed={0.3}
      dampingFactor={0.1}
      enableDamping={true}
      maxPolarAngle={Math.PI}
      minPolarAngle={0}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      panSpeed={0.8}
      // Mobile optimizations
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
    />
  );
};

// Simplified marker component for mobile performance
const SimplifiedMarker: React.FC<{
  position: THREE.Vector3;
  color: string;
  isSelected?: boolean;
  onClick: () => void;
}> = ({ position, color, isSelected, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      const scale = isSelected ? 1.3 : 1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} position={position} onClick={onClick}>
      <sphereGeometry args={[0.015, 8, 6]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={isSelected ? 1 : 0.8}
      />
    </mesh>
  );
};

export const MobileOptimizedMap: React.FC<MobileOptimizedMapProps> = ({
  exchanges,
  connections,
  theme,
  onExchangeClick,
}) => {
  const [performanceMode, setPerformanceMode] = useState<
    "high" | "medium" | "low"
  >("medium");
  const [fps, setFps] = useState(60);
  const [selectedExchange, setSelectedExchange] =
    useState<ExchangeLocation | null>(null);

  // Detect device performance
  useEffect(() => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");

    if (gl) {
      const renderer = gl.getParameter(gl.RENDERER);

      // Simple heuristic for device performance
      if (renderer.includes("PowerVR") || renderer.includes("Adreno 3")) {
        setPerformanceMode("low");
      } else if (
        renderer.includes("Mali") ||
        navigator.hardwareConcurrency <= 4
      ) {
        setPerformanceMode("medium");
      } else {
        setPerformanceMode("high");
      }
    }

    // Memory-based detection
    if (
      hasMemory(performance) &&
      performance.memory.usedJSHeapSize > 50000000
    ) {
      setPerformanceMode((prev) => (prev === "high" ? "medium" : "low"));
    }
  }, []);

  // FPS monitoring for dynamic quality adjustment
  const fpsCounter = useCallback(() => {
    let frames = 0;
    let lastTime = performance.now();

    const count = () => {
      frames++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        const currentFps = Math.round(
          (frames * 1000) / (currentTime - lastTime)
        );
        setFps(currentFps);

        // Auto-adjust performance mode based on FPS
        if (currentFps < 30 && performanceMode !== "low") {
          setPerformanceMode("low");
        } else if (currentFps > 45 && performanceMode === "low") {
          setPerformanceMode("medium");
        }

        frames = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(count);
    };

    requestAnimationFrame(count);
  }, [performanceMode]);

  useEffect(() => {
    fpsCounter();
  }, [fpsCounter]);

  const handleExchangeClick = useCallback(
    (exchange: ExchangeLocation) => {
      setSelectedExchange(exchange);
      onExchangeClick?.(exchange);

      // Haptic feedback on mobile
      if ("vibrate" in navigator) {
        navigator.vibrate(50);
      }
    },
    [onExchangeClick]
  );

  // Performance-based rendering settings
  const getRenderSettings = () => {
    switch (performanceMode) {
      case "low":
        return {
          pixelRatio: Math.min(window.devicePixelRatio, 1),
          shadows: false,
          antialias: false,
          powerPreference: "low-power" as const,
          maxMarkers: 8,
          maxConnections: 5,
        };
      case "medium":
        return {
          pixelRatio: Math.min(window.devicePixelRatio, 1.5),
          shadows: false,
          antialias: true,
          powerPreference: "default" as const,
          maxMarkers: 15,
          maxConnections: 10,
        };
      default:
        return {
          pixelRatio: window.devicePixelRatio,
          shadows: true,
          antialias: true,
          powerPreference: "high-performance" as const,
          maxMarkers: exchanges.length,
          maxConnections: connections.length,
        };
    }
  };

  const settings = getRenderSettings();

  // Filter data based on performance mode
  const visibleExchanges = exchanges.slice(0, settings.maxMarkers);

  return (
    <div className="relative w-full h-full max-sm:block hidden">
      {/* Performance Indicator */}
      <div className="absolute top-2 right-2 z-10 text-xs bg-black/50 text-white px-2 py-1 rounded">
        {fps}fps • {performanceMode}
      </div>

      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 60 }}
        gl={{
          antialias: settings.antialias,
          powerPreference: settings.powerPreference,
          alpha: true,
        }}
        dpr={settings.pixelRatio}
        performance={{ min: 0.5 }}
        style={{
          background: theme === "dark" ? "#000011" : "#f0f9ff",
          touchAction: "none", // Prevent default touch behaviors
        }}
      >
        {/* Simplified lighting for mobile */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 2, 2]} intensity={0.8} />

        {/* Simplified Earth */}
        <mesh>
          <sphereGeometry args={[1, 32, 16]} />
          <meshBasicMaterial
            color={theme === "dark" ? "#1e3a8a" : "#0284c7"}
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* Exchange Markers */}
        {visibleExchanges.map((exchange) => {
          const phi = (90 - exchange.coordinates.latitude) * (Math.PI / 180);
          const theta =
            (exchange.coordinates.longitude + 180) * (Math.PI / 180);
          const position = new THREE.Vector3(
            -1.05 * Math.sin(phi) * Math.cos(theta),
            1.05 * Math.cos(phi),
            1.05 * Math.sin(phi) * Math.sin(theta)
          );

          return (
            <SimplifiedMarker
              key={exchange.id}
              position={position}
              color={theme === "dark" ? "#3b82f6" : "#2563eb"}
              isSelected={selectedExchange?.id === exchange.id}
              onClick={() => handleExchangeClick(exchange)}
            />
          );
        })}

        {/* Mobile Camera Controls */}
        <MobileCameraControls />
      </Canvas>

      {/* Touch Controls Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded">
          Pinch to zoom • Drag to rotate
        </div>
      </div>
    </div>
  );
};
