"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { RotateCcw, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TouchControlsProps {
  onRotate?: (direction: "left" | "right") => void;
  onZoom?: (direction: "in" | "out") => void;
  onReset?: () => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  isVisible?: boolean;
  className?: string;
}

interface TouchGesture {
  type: "pan" | "pinch" | "rotate";
  startTouches: Touch[];
  currentTouches: Touch[];
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onRotate,
  onZoom,
  onReset,
  onPan,
  isVisible = true,
  className,
}) => {
  const [isGestureActive, setIsGestureActive] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<TouchGesture | null>(
    null
  );
  const gestureRef = useRef<HTMLDivElement>(null);

  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  }, []);

  const getAngle = useCallback((touch1: Touch, touch2: Touch): number => {
    return (
      (Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      ) *
        180) /
      Math.PI
    );
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();

    const touches = Array.from(e.touches);
    if (touches.length === 1) {
      // Single touch - pan
      setCurrentGesture({
        type: "pan",
        startTouches: touches,
        currentTouches: touches,
      });
    } else if (touches.length === 2) {
      // Two touches - pinch/zoom or rotate
      setCurrentGesture({
        type: "pinch",
        startTouches: touches,
        currentTouches: touches,
      });
    }

    setIsGestureActive(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!currentGesture) return;

      e.preventDefault();
      const touches = Array.from(e.touches);

      if (currentGesture.type === "pan" && touches.length === 1) {
        const deltaX =
          touches[0].clientX - currentGesture.startTouches[0].clientX;
        const deltaY =
          touches[0].clientY - currentGesture.startTouches[0].clientY;
        onPan?.(deltaX, deltaY);
      } else if (currentGesture.type === "pinch" && touches.length === 2) {
        const startDistance = getDistance(
          currentGesture.startTouches[0],
          currentGesture.startTouches[1]
        );
        const currentDistance = getDistance(touches[0], touches[1]);
        const scale = currentDistance / startDistance;

        if (scale > 1.1) {
          onZoom?.("in");
        } else if (scale < 0.9) {
          onZoom?.("out");
        }

        // Check for rotation
        const startAngle = getAngle(
          currentGesture.startTouches[0],
          currentGesture.startTouches[1]
        );
        const currentAngle = getAngle(touches[0], touches[1]);
        const angleDiff = currentAngle - startAngle;

        if (Math.abs(angleDiff) > 15) {
          onRotate?.(angleDiff > 0 ? "right" : "left");
        }
      }

      setCurrentGesture((prev) =>
        prev ? { ...prev, currentTouches: touches } : null
      );
    },
    [currentGesture, getDistance, getAngle, onPan, onZoom, onRotate]
  );

  const handleTouchEnd = useCallback(() => {
    setIsGestureActive(false);
    setCurrentGesture(null);
  }, []);

  useEffect(() => {
    const element = gestureRef.current;
    if (!element) return;

    element.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (!isVisible) return null;

  return (
    <div
      ref={gestureRef}
      className={`fixed right-4 top-1/2 -translate-y-1/2 z-30 lg:hidden ${className}`}
    >
      <Card className="p-2 space-y-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur">
        <div className="text-xs text-center text-gray-600 dark:text-gray-400 pb-2 border-b">
          Touch Controls
        </div>

        {/* Zoom Controls */}
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onZoom?.("in")}
            className="w-full justify-center h-8"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onZoom?.("out")}
            className="w-full justify-center h-8"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
        </div>

        <div className="border-t pt-2">
          {/* Rotation Controls */}
          <div className="grid grid-cols-2 gap-1 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRotate?.("left")}
              className="h-8"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRotate?.("right")}
              className="h-8"
            >
              <RotateCw className="w-3 h-3" />
            </Button>
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="w-full h-8"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>

        {/* Gesture Indicator */}
        {isGestureActive && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
            <div className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
              {currentGesture?.type === "pan" ? "Panning" : "Pinch/Zoom"}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
