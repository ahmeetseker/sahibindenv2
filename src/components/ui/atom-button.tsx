import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { GlassButton } from '@/components/ui/glass-button';

type Vec2 = { x: number; y: number };

const midpointDisplace = (
  pts: Vec2[],
  depth: number,
  jitter: number,
): Vec2[] => {
  if (depth <= 0) return pts;
  const out: Vec2[] = [pts[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const off = (Math.random() - 0.5) * jitter;
    out.push({ x: (a.x + b.x) / 2 + nx * off, y: (a.y + b.y) / 2 + ny * off });
    out.push(b);
  }
  return midpointDisplace(out, depth - 1, jitter * 0.55);
};

const pointsToPath = (pts: Vec2[]) =>
  pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ');

const generateBoltPath = (target: Vec2): string => {
  const totalLen = Math.hypot(target.x, target.y) || 1;
  const main = midpointDisplace([{ x: 0, y: 0 }, target], 5, totalLen * 0.18);
  const segments: string[] = [pointsToPath(main)];
  for (let i = 2; i < main.length - 1; i++) {
    if (Math.random() < 0.32) {
      const p = main[i];
      const prev = main[i - 1];
      const baseAngle = Math.atan2(p.y - prev.y, p.x - prev.x);
      const branchAngle = baseAngle + (Math.random() - 0.5) * Math.PI * 0.9;
      const branchLen = totalLen * (0.18 + Math.random() * 0.32);
      const end: Vec2 = {
        x: p.x + Math.cos(branchAngle) * branchLen,
        y: p.y + Math.sin(branchAngle) * branchLen,
      };
      const branch = midpointDisplace([p, end], 3, branchLen * 0.22);
      segments.push(pointsToPath(branch));
      if (branch.length > 4 && Math.random() < 0.35) {
        const sp = branch[Math.floor(branch.length / 2)];
        const subAngle = branchAngle + (Math.random() - 0.5) * Math.PI * 0.7;
        const subLen = branchLen * (0.4 + Math.random() * 0.4);
        const subEnd: Vec2 = {
          x: sp.x + Math.cos(subAngle) * subLen,
          y: sp.y + Math.sin(subAngle) * subLen,
        };
        segments.push(pointsToPath(midpointDisplace([sp, subEnd], 2, subLen * 0.25)));
      }
    }
  }
  return segments.join(' ');
};

export interface AtomButtonProps {
  onClick: () => void;
}

export function AtomButton({ onClick }: AtomButtonProps) {
  const [atomHover, setAtomHover] = useState(false);
  const atomHoverRef = useRef(false);
  useEffect(() => {
    atomHoverRef.current = atomHover;
  }, [atomHover]);
  const [electronPositions, setElectronPositions] = useState<Vec2[]>([
    { x: 22, y: 0 },
    { x: 22, y: 0 },
    { x: 22, y: 0 },
  ]);
  const [atomBolts, setAtomBolts] = useState<({ d: string; intensity: number } | null)[]>([
    null,
    null,
    null,
  ]);

  useEffect(() => {
    const orbitDur = 7;
    const fadeStart = 16;
    const fadeEnd = 9;
    const start = performance.now();
    let raf = 0;
    let lastBoltUpdate = -1000;
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const positions: Vec2[] = [0, 60, 120].map((angleDeg, i) => {
        const leadBegin = i * -(orbitDur / 3);
        const progress = (((t - leadBegin) / orbitDur) % 1 + 1) % 1;
        const theta = progress * 2 * Math.PI;
        const lx = 22 * Math.cos(theta);
        const ly = 9 * Math.sin(theta);
        const a = (angleDeg * Math.PI) / 180;
        return {
          x: lx * Math.cos(a) - ly * Math.sin(a),
          y: lx * Math.sin(a) + ly * Math.cos(a),
        };
      });
      setElectronPositions(positions);

      if (now - lastBoltUpdate > 70) {
        const hover = atomHoverRef.current;
        const bolts = positions.map((p) => {
          if (hover) {
            return { d: generateBoltPath(p), intensity: 1 };
          }
          const dist = Math.hypot(p.x, p.y);
          if (dist >= fadeStart) return null;
          const intensity = Math.max(
            0,
            Math.min(1, (fadeStart - dist) / (fadeStart - fadeEnd)),
          );
          return { d: generateBoltPath(p), intensity };
        });
        setAtomBolts(bolts);
        lastBoltUpdate = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="fixed bottom-20 right-6 z-40 pointer-events-auto"
      onPointerEnter={() => setAtomHover(true)}
      onPointerLeave={() => setAtomHover(false)}
    >
      <GlassButton
        size="icon"
        aria-label="Yapay zeka asistanı"
        onClick={onClick}
        className="!h-14 !w-14 sm:!h-16 sm:!w-16 md:!h-[4.5rem] md:!w-[4.5rem]"
        buttonClassName="!h-14 !w-14 sm:!h-16 sm:!w-16 md:!h-[4.5rem] md:!w-[4.5rem]"
        contentClassName="!h-14 !w-14 sm:!h-16 sm:!w-16 md:!h-[4.5rem] md:!w-[4.5rem]"
      >
        <motion.svg
          viewBox="-30 -30 60 60"
          aria-hidden="true"
          className="text-neutral-900 dark:text-neutral-100"
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: 'center' }}
        >
          <defs>
            <radialGradient id="atom-nucleus" cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#f0fbff" />
              <stop offset="35%" stopColor="#5cc6ff" />
              <stop offset="100%" stopColor="#0b3aa8" />
            </radialGradient>
            <radialGradient id="atom-nucleus-aura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#aee6ff" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#3a9bff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#1f5dff" stopOpacity="0" />
            </radialGradient>
            <filter id="atom-depth" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="0.5" />
              <feOffset dx="0.3" dy="0.6" result="off" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.55" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="atom-glow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="1.6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="bolt-halo" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.6" />
            </filter>
            <filter id="bolt-soft" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.9" />
            </filter>
          </defs>

          <g filter="url(#atom-depth)">
            {[0, 60, 120].map((angle) => (
              <g key={angle} transform={`rotate(${angle})`}>
                <ellipse cx="0" cy="0" rx="22" ry="9" fill="none" stroke="#1d6cff" strokeWidth={3.6} opacity={0.55} filter="url(#bolt-halo)" />
                <ellipse cx="0" cy="0" rx="22" ry="9" fill="none" stroke="#7ac4ff" strokeWidth={1.4} opacity={0.9} filter="url(#bolt-soft)" />
                <ellipse cx="0" cy="0" rx="22" ry="9" fill="none" stroke="#ffffff" strokeWidth={0.55} opacity={0.95} />
              </g>
            ))}

            {electronPositions.map((p, idx) => (
              <circle key={`e-${idx}`} cx={p.x} cy={p.y} r={1.9} fill="#e9f6ff" filter="url(#atom-glow)" />
            ))}

            <g>
              {atomBolts.map((bolt, idx) =>
                bolt ? (
                  <g key={`bolt-${idx}`} opacity={bolt.intensity}>
                    <path d={bolt.d} fill="none" stroke="#0b3aa8" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} filter="url(#bolt-halo)" />
                    <path d={bolt.d} fill="none" stroke="#1d6cff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} filter="url(#bolt-soft)" />
                    <path d={bolt.d} fill="none" stroke="#7ac4ff" strokeWidth={0.7} strokeLinecap="round" strokeLinejoin="round" opacity={1} />
                  </g>
                ) : null,
              )}
            </g>
            <motion.circle
              cx="0"
              cy="0"
              r="7"
              fill="url(#atom-nucleus-aura)"
              animate={{ scale: [1, 1.25, 1], opacity: [0.55, 0.95, 0.55] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: 'center' }}
            />
            <circle cx="0" cy="0" r="4" fill="url(#atom-nucleus)" filter="url(#atom-glow)" />
          </g>
        </motion.svg>
      </GlassButton>
    </div>
  );
}
