"use client";

import { type ReactNode, Children } from "react";

interface ToolScrollRailProps {
  children: ReactNode;
  duration?: number;
  animate?: boolean;
  className?: string;
}

export function ToolScrollRail({
  children,
  duration = 28,
  animate = true,
  className = "",
}: ToolScrollRailProps) {
  const items = Children.toArray(children);
  const shouldAnimate = animate && items.length > 1;
  const renderedItems = shouldAnimate ? [...items, ...items] : items;

  return (
    <div
      className={`w-full ${shouldAnimate ? "overflow-hidden" : "overflow-x-auto scrollbar-hide"} ${className}`}
      style={{ width: "100%" }}
    >
      <div
        className={`inline-flex w-max items-center gap-2 ${shouldAnimate ? "scroll-row-left py-0.5" : ""}`}
        style={
          shouldAnimate
            ? {
                animationDuration: `${duration}s`,
                WebkitAnimationDuration: `${duration}s`,
              }
            : undefined
        }
      >
        {renderedItems.map((child, index) => (
          <div key={`${index}-${child?.toString()}`} className="flex-shrink-0">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
