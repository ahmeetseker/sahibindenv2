"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

interface GlassEffectProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  href?: string;
  target?: string;
}

export interface DockIcon {
  src?: string;
  alt: string;
  icon?: React.ReactNode;
  label?: string;
  onClick?: () => void;
  active?: boolean;
}

export const GlassEffect: React.FC<GlassEffectProps> = ({
  children,
  className = "",
  style = {},
  href,
  target = "_blank",
}) => {
  const glassStyle: React.CSSProperties = {
    boxShadow: "var(--glass-shadow)",
    color: "var(--glass-text)",
    transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
    ...style,
  };

  const content = (
    <div
      className={`relative flex font-semibold cursor-pointer transition-all duration-700 ${className}`}
      style={glassStyle}
    >
      <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 z-0"
          style={{
            backdropFilter: "blur(14px) saturate(180%)",
            WebkitBackdropFilter: "blur(14px) saturate(180%)",
            filter: "url(#glass-distortion)",
            isolation: "isolate",
          }}
        />
        <div
          className="absolute inset-0 z-10"
          style={{ background: "var(--glass-tint)" }}
        />
        <div
          className="absolute inset-0 z-20"
          style={{
            boxShadow:
              "inset 2px 2px 1px 0 var(--glass-highlight), inset -1px -1px 1px 1px var(--glass-highlight-soft)",
          }}
        />
      </div>

      <div className="relative z-30 flex-1 min-w-0">{children}</div>
    </div>
  );

  return href ? (
    <a href={href} target={target} rel="noopener noreferrer" className="block">
      {content}
    </a>
  ) : (
    content
  );
};

const DOCK_BASE_ICON_SIZE = 38;
const DOCK_BASE_SPACING = 6;
const DOCK_MIN_SCALE = 1.0;
const DOCK_MAX_SCALE = 1.5;
const DOCK_EFFECT_WIDTH = 180;

const calcInitialDockPositions = (count: number): number[] => {
  let x = 0;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const c = x + DOCK_BASE_ICON_SIZE / 2;
    x += DOCK_BASE_ICON_SIZE + DOCK_BASE_SPACING;
    out.push(c);
  }
  return out;
};

export const GlassDock: React.FC<{ icons: DockIcon[]; href?: string }> = ({
  icons,
  href,
}) => {
  const dockRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastMouseMoveTime = useRef<number>(0);

  const [mouseX, setMouseX] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [scales, setScales] = useState<number[]>(() =>
    icons.map(() => DOCK_MIN_SCALE)
  );
  const [positions, setPositions] = useState<number[]>(() =>
    calcInitialDockPositions(icons.length)
  );

  useEffect(() => {
    setScales(icons.map(() => DOCK_MIN_SCALE));
    setPositions(calcInitialDockPositions(icons.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [icons.length]);

  const calcTargetScales = useCallback(
    (mx: number | null): number[] => {
      const count = icons.length;
      if (mx === null)
        return Array.from({ length: count }, () => DOCK_MIN_SCALE);
      return Array.from({ length: count }, (_, index) => {
        const center =
          index * (DOCK_BASE_ICON_SIZE + DOCK_BASE_SPACING) +
          DOCK_BASE_ICON_SIZE / 2;
        const minX = mx - DOCK_EFFECT_WIDTH / 2;
        const maxX = mx + DOCK_EFFECT_WIDTH / 2;
        if (center < minX || center > maxX) return DOCK_MIN_SCALE;
        const theta = ((center - minX) / DOCK_EFFECT_WIDTH) * 2 * Math.PI;
        const capped = Math.min(Math.max(theta, 0), 2 * Math.PI);
        const f = (1 - Math.cos(capped)) / 2;
        return DOCK_MIN_SCALE + f * (DOCK_MAX_SCALE - DOCK_MIN_SCALE);
      });
    },
    [icons.length]
  );

  const calcTargetPositions = useCallback((targetScales: number[]) => {
    let x = 0;
    return targetScales.map((s) => {
      const w = DOCK_BASE_ICON_SIZE * s;
      const c = x + w / 2;
      x += w + DOCK_BASE_SPACING;
      return c;
    });
  }, []);

  const animate = useCallback(() => {
    const targetScales = calcTargetScales(mouseX);
    const targetPositions = calcTargetPositions(targetScales);
    const lerp = mouseX !== null ? 0.2 : 0.12;

    setScales((prev) =>
      prev.length === targetScales.length
        ? prev.map((s, i) => s + (targetScales[i] - s) * lerp)
        : targetScales
    );
    setPositions((prev) =>
      prev.length === targetPositions.length
        ? prev.map((p, i) => p + (targetPositions[i] - p) * lerp)
        : targetPositions
    );

    const scalesNeed = scales.some(
      (s, i) => Math.abs(s - (targetScales[i] ?? DOCK_MIN_SCALE)) > 0.002
    );
    const positionsNeed = positions.some(
      (p, i) => Math.abs(p - (targetPositions[i] ?? 0)) > 0.1
    );

    if (scalesNeed || positionsNeed || mouseX !== null) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [mouseX, calcTargetScales, calcTargetPositions, scales, positions]);

  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const now = performance.now();
    if (now - lastMouseMoveTime.current < 16) return;
    lastMouseMoveTime.current = now;
    if (dockRef.current) {
      const rect = dockRef.current.getBoundingClientRect();
      setMouseX(e.clientX - rect.left);
    }
  }, []);

  const handleMouseLeave = useCallback(() => setMouseX(null), []);

  const contentWidth =
    positions.length > 0
      ? Math.max(
          ...positions.map(
            (p, i) =>
              p + (DOCK_BASE_ICON_SIZE * (scales[i] ?? DOCK_MIN_SCALE)) / 2
          )
        )
      : icons.length * (DOCK_BASE_ICON_SIZE + DOCK_BASE_SPACING) -
        DOCK_BASE_SPACING;

  const trackHeight = DOCK_BASE_ICON_SIZE;

  return (
    <GlassEffect
      href={href}
      className="rounded-full px-2 py-1.5"
      style={{ overflow: "visible" }}
    >
      <div
        ref={dockRef}
        className="relative"
        style={{
          width: `${contentWidth}px`,
          height: `${trackHeight}px`,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {icons.map((icon, index) => {
          const scale = scales[index] ?? DOCK_MIN_SCALE;
          const position = positions[index] ?? 0;

          const tile = icon.icon ? (
            <div
              role={icon.onClick ? "button" : undefined}
              aria-label={icon.alt}
              className={`w-full h-full flex items-center justify-center rounded-full transition-colors ${
                icon.active
                  ? "bg-stone-900/15 dark:bg-stone-100/15 ring-1 ring-stone-900/20 dark:ring-stone-100/20 shadow-inner"
                  : ""
              }`}
            >
              {icon.icon}
            </div>
          ) : (
            <img
              src={icon.src}
              alt={icon.alt}
              className="w-full h-full object-contain"
              draggable={false}
            />
          );

          const labelText = icon.label ?? icon.alt;
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={index}
              onClick={icon.onClick}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() =>
                setHoveredIndex((prev) => (prev === index ? null : prev))
              }
              className="absolute cursor-pointer"
              style={{
                left: `${position - DOCK_BASE_ICON_SIZE / 2}px`,
                bottom: 0,
                width: `${DOCK_BASE_ICON_SIZE}px`,
                height: `${DOCK_BASE_ICON_SIZE}px`,
                transform: `scale(${scale})`,
                transformOrigin: "50% 100%",
                zIndex: Math.round(scale * 10),
              }}
            >
              {isHovered && (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-1/2 bottom-full mb-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border/60 bg-background/90 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-foreground shadow-md backdrop-blur-md"
                >
                  {labelText}
                </span>
              )}
              {tile}
            </div>
          );
        })}
      </div>
    </GlassEffect>
  );
};

export const GlassDockVertical: React.FC<{
  icons: DockIcon[];
  onIconClick?: () => void;
}> = ({ icons, onIconClick }) => {
  return (
    <GlassEffect
      className="rounded-full px-1.5 py-2"
      style={{ overflow: "visible" }}
    >
      <div className="flex flex-col items-center gap-1.5">
        {icons.map((icon, index) => {
          const tile = icon.icon ? (
            <div
              className={`flex h-full w-full items-center justify-center rounded-full transition-colors ${
                icon.active
                  ? "bg-stone-900/15 dark:bg-stone-100/15 ring-1 ring-stone-900/20 dark:ring-stone-100/20 shadow-inner"
                  : ""
              }`}
            >
              {icon.icon}
            </div>
          ) : (
            <img
              src={icon.src}
              alt={icon.alt}
              className="w-full h-full object-contain"
              draggable={false}
            />
          );

          return (
            <button
              key={index}
              type="button"
              aria-label={icon.alt}
              onClick={() => {
                icon.onClick?.();
                onIconClick?.();
              }}
              className="relative h-10 w-10 cursor-pointer transition-transform active:scale-95"
            >
              {tile}
            </button>
          );
        })}
      </div>
    </GlassEffect>
  );
};

export const GlassButton: React.FC<{
  children: React.ReactNode;
  href?: string;
}> = ({ children, href }) => (
  <GlassEffect
    href={href}
    className="rounded-3xl px-10 py-6 hover:px-11 hover:py-7 hover:rounded-4xl overflow-hidden"
  >
    <div
      className="transition-all duration-700 hover:scale-95"
      style={{
        transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
      }}
    >
      {children}
    </div>
  </GlassEffect>
);

export const GlassFilter: React.FC = () => (
  <svg style={{ display: "none" }}>
    <filter
      id="glass-distortion"
      x="0%"
      y="0%"
      width="100%"
      height="100%"
      filterUnits="objectBoundingBox"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.001 0.005"
        numOctaves="1"
        seed="17"
        result="turbulence"
      />
      <feComponentTransfer in="turbulence" result="mapped">
        <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
        <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
        <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
      </feComponentTransfer>
      <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
      <feSpecularLighting
        in="softMap"
        surfaceScale="5"
        specularConstant="1"
        specularExponent="100"
        lightingColor="white"
        result="specLight"
      >
        <fePointLight x="-200" y="-200" z="300" />
      </feSpecularLighting>
      <feComposite
        in="specLight"
        operator="arithmetic"
        k1="0"
        k2="1"
        k3="1"
        k4="0"
        result="litImage"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="softMap"
        scale="60"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </svg>
);

export const Component = () => {
  const dockIcons: DockIcon[] = [
    {
      src: "https://parsefiles.back4app.com/JPaQcFfEEQ1ePBxbf6wvzkPMEqKYHhPYv8boI1Rc/a13d1acfd046f503f987c1c95af582c8_low_res_Claude.png",
      alt: "Claude",
    },
    {
      src: "https://parsefiles.back4app.com/JPaQcFfEEQ1ePBxbf6wvzkPMEqKYHhPYv8boI1Rc/9e80c50a5802d3b0a7ec66f3fe4ce348_low_res_Finder.png",
      alt: "Finder",
    },
    {
      src: "https://parsefiles.back4app.com/JPaQcFfEEQ1ePBxbf6wvzkPMEqKYHhPYv8boI1Rc/c2c4a538c2d42a8dc0927d7d6530d125_low_res_ChatGPT___Liquid_Glass__Default_.png",
      alt: "Chatgpt",
    },
    {
      src: "https://parsefiles.back4app.com/JPaQcFfEEQ1ePBxbf6wvzkPMEqKYHhPYv8boI1Rc/6d26d432bd65c522b0708185c0768ec3_low_res_Maps.png",
      alt: "Maps",
    },
    {
      src: "https://parsefiles.back4app.com/JPaQcFfEEQ1ePBxbf6wvzkPMEqKYHhPYv8boI1Rc/7c59c945731aecf4f91eb8c2c5f867ce_low_res_Safari.png",
      alt: "Safari",
    },
    {
      src: "https://parsefiles.back4app.com/JPaQcFfEEQ1ePBxbf6wvzkPMEqKYHhPYv8boI1Rc/b7f24edc7183f63dbe34c1943bef2967_low_res_Steam___Liquid_Glass__Default_.png",
      alt: "Steam",
    },
  ];

  return (
    <div
      className="min-h-screen h-full flex items-center justify-center font-light relative overflow-hidden w-full"
      style={{
        background: `url("https://images.unsplash.com/photo-1432251407527-504a6b4174a2?q=80&w=1480&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D") center center`,
        animation: "moveBackground 60s linear infinite",
      }}
    >
      <GlassFilter />

      <div className="flex flex-col gap-6 items-center justify-center w-full">
        <GlassDock icons={dockIcons} href="https://x.com/notsurajgaud" />

        <GlassButton href="https://x.com/notsurajgaud">
          <div className="text-xl text-white">
            <p>How can i help you today?</p>
          </div>
        </GlassButton>
      </div>
    </div>
  );
};
