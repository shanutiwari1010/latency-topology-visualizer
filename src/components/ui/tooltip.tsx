"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration = 300,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  delayDuration?: number;
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            className="z-50 rounded bg-black px-3 py-1.5 text-xs text-white shadow-lg animate-in fade-in-0"
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-black" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
