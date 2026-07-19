"use client";

import { useId } from "react";

/*
 * PaperTexture — ported 1:1 from the mobile app's brutal.tsx (issue #41).
 * fractalNoise grain gives the paper its tooth; a barely-there graph grid on
 * top reads as "engineering paper". The grid tints to the theme brand (a CSS
 * var, so it re-colors with light/dark automatically).
 *
 * Native web SVG filter — ZERO network requests, one static layer. If in-app
 * browsers show jank over this, pre-rasterize to a tiled PNG (WEB_PLAN §7.2);
 * decide by measurement, not taste.
 *
 * mode="fixed" (default) = full-viewport background behind everything.
 * mode="fill"           = absolute inset-0 inside a positioned parent (used by
 *                         the /design texture-at-3-opacities specimen).
 */
export function PaperTexture({
  opacity = 0.06,
  grid = true,
  gridCell = 24,
  gridOpacity = 0.05,
  gridColor = "var(--brand)",
  mode = "fixed",
}: {
  opacity?: number;
  grid?: boolean;
  gridCell?: number;
  gridOpacity?: number;
  gridColor?: string;
  mode?: "fixed" | "fill";
}) {
  // Unique per-instance ids so multiple textures never reference each other's
  // <defs> (the /design page renders several at once).
  const uid = useId().replace(/:/g, "");
  const grainId = `grain-${uid}`;
  const gridId = `grid-${uid}`;

  return (
    <div
      aria-hidden
      style={{
        position: mode === "fixed" ? "fixed" : "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <svg width="100%" height="100%">
        <defs>
          <filter id={grainId}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves={2}
              stitchTiles="stitch"
              result="n"
            />
            <feColorMatrix in="n" type="saturate" values="0" />
          </filter>
          {grid ? (
            <pattern
              id={gridId}
              width={gridCell}
              height={gridCell}
              patternUnits="userSpaceOnUse"
            >
              {/* top + left edge of each cell → a seamless grid when tiled.
                  stroke goes through `style` (CSS) so a var(--brand) token
                  resolves — CSS custom properties don't work in SVG
                  presentation attributes. */}
              <path
                d={`M ${gridCell} 0 L 0 0 L 0 ${gridCell}`}
                style={{ stroke: gridColor }}
                strokeWidth={1}
                fill="none"
              />
            </pattern>
          ) : null}
        </defs>
        {grid ? (
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill={`url(#${gridId})`}
            opacity={gridOpacity}
          />
        ) : null}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          filter={`url(#${grainId})`}
          opacity={opacity}
        />
      </svg>
    </div>
  );
}
