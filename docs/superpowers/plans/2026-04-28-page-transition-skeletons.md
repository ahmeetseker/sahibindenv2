# Page Transition Skeletons + Atom Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the perceived freeze when switching pages from the header dock and remove layout shift during page mount, by isolating the lightning/electron animation into its own component and adding a skeleton system that masks page mount cost.

**Architecture:** Two independent layers. Layer 1 extracts the atom button (with its `requestAnimationFrame` state) into `src/components/ui/atom-button.tsx`, so its 60+ setStates per second only re-render the atom — not the parent that holds all 9 pages. Layer 2 adds a hybrid skeleton system: one shared `PageSkeletonShell` (matching `PageShell`'s container) plus 9 page-specific content skeletons under `src/components/pages/skeletons/`, gated by a `pageReady` cache in `InfiniteGrid` that uses two `requestAnimationFrame` ticks to guarantee the skeleton paints before the real page mounts.

**Tech Stack:** React 19, TypeScript, Vite, framer-motion 12, Tailwind 4, Vitest (jsdom + @testing-library/jest-dom).

**Spec reference:** `docs/superpowers/specs/2026-04-28-page-transition-skeletons-design.md`

---

## File structure

**New files:**
- `src/components/ui/atom-button.tsx` — isolated atom SVG + animation state
- `src/components/pages/skeletons/page-skeleton-shell.tsx` — shared header skeleton matching `PageShell`
- `src/components/pages/skeletons/dashboard-home-skeleton.tsx`
- `src/components/pages/skeletons/listings-skeleton.tsx`
- `src/components/pages/skeletons/customers-skeleton.tsx`
- `src/components/pages/skeletons/finance-skeleton.tsx`
- `src/components/pages/skeletons/reports-skeleton.tsx`
- `src/components/pages/skeletons/calendar-skeleton.tsx`
- `src/components/pages/skeletons/messages-skeleton.tsx`
- `src/components/pages/skeletons/search-skeleton.tsx`
- `src/components/pages/skeletons/profile-skeleton.tsx`
- `src/components/pages/skeletons/__tests__/page-skeleton-shell.test.tsx`
- `src/components/ui/__tests__/atom-button.test.tsx`

**Modified:**
- `src/components/ui/infinite-grid-integration.tsx` — remove atom state/effect/SVG; add `pageReady` cache + skeleton routing

---

## Task 1: Extract atom helpers and types into the new module

**Files:**
- Create: `src/components/ui/atom-button.tsx`

These pure helpers currently live in `infinite-grid-integration.tsx:56-133`. We'll re-create them inside `atom-button.tsx` (same file as the component since they're only used there). The original copies stay in `infinite-grid-integration.tsx` for now — Task 5 removes them.

- [ ] **Step 1: Create the new file with helpers**

```tsx
// src/components/ui/atom-button.tsx
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

export function AtomButton(_: AtomButtonProps) {
  return null; // placeholder, filled in Task 2
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/atom-button.tsx
git commit -m "feat(atom-button): scaffold isolated atom module with helpers"
```

---

## Task 2: Implement the AtomButton component body

**Files:**
- Modify: `src/components/ui/atom-button.tsx`

Move the atom state, `requestAnimationFrame` loop, and SVG render block (currently in `infinite-grid-integration.tsx:179-198, 202-246, 797-971`) into the new component.

- [ ] **Step 1: Replace the placeholder export with the full implementation**

Replace the `export function AtomButton(_: AtomButtonProps) { return null; }` block with:

```tsx
export function AtomButton({ onClick }: AtomButtonProps) {
  const [atomHover, setAtomHover] = useState(false);
  const atomHoverRef = useRef(false);
  atomHoverRef.current = atomHover;
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/atom-button.tsx
git commit -m "feat(atom-button): implement isolated atom component with own raf loop"
```

---

## Task 3: Add render test for AtomButton

**Files:**
- Create: `src/components/ui/__tests__/atom-button.test.tsx`

- [ ] **Step 1: Write the test**

```tsx
// src/components/ui/__tests__/atom-button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AtomButton } from '../atom-button';

describe('AtomButton', () => {
  it('renders with the AI assistant aria-label', () => {
    render(<AtomButton onClick={() => {}} />);
    expect(screen.getByLabelText('Yapay zeka asistanı')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<AtomButton onClick={onClick} />);
    screen.getByLabelText('Yapay zeka asistanı').click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npx vitest run src/components/ui/__tests__/atom-button.test.tsx`
Expected: 2 passed.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/__tests__/atom-button.test.tsx
git commit -m "test(atom-button): add render and onClick test"
```

---

## Task 4: Replace inlined atom in InfiniteGrid with `<AtomButton />`

**Files:**
- Modify: `src/components/ui/infinite-grid-integration.tsx`

This task swaps the atom render block for the new component. The state, `useEffect`, and helpers are still inlined — Task 5 cleans those up. We do this in two steps to keep the diff reviewable.

- [ ] **Step 1: Add the import at the top**

In `src/components/ui/infinite-grid-integration.tsx`, after the existing `import { GlassButton } from '@/components/ui/glass-button';` line, add:

```tsx
import { AtomButton } from '@/components/ui/atom-button';
```

- [ ] **Step 2: Replace the inline atom block**

Find the block from `src/components/ui/infinite-grid-integration.tsx:797` that starts with:

```tsx
<div
  className="fixed bottom-20 right-6 z-40 pointer-events-auto"
  onPointerEnter={() => setAtomHover(true)}
  onPointerLeave={() => setAtomHover(false)}
>
  <GlassButton
    size="icon"
    aria-label="Yapay zeka asistanı"
    ...
```

and ends at the matching closing `</div>` (around line 971, just before `<AssistantModal`).

Replace the entire block with:

```tsx
<AtomButton onClick={() => setAssistantOpen(true)} />
```

- [ ] **Step 3: Verify TypeScript and build**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 4: Verify the existing test suite still passes**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev`
Open browser, confirm: atom button is rendered bottom-right, electrons orbit, hovering shows lightning bolts, clicking opens the assistant modal. (At this point the parent still owns duplicate state — the perf win comes after Task 5. This task only verifies visual parity.)

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/infinite-grid-integration.tsx
git commit -m "refactor(infinite-grid): use AtomButton component instead of inline atom"
```

---

## Task 5: Remove dead atom state and helpers from InfiniteGrid

**Files:**
- Modify: `src/components/ui/infinite-grid-integration.tsx`

After Task 4, the inlined atom state (`electronPositions`, `atomBolts`, `atomHover`, `atomHoverRef`), the rAF effect, and the helper functions (`midpointDisplace`, `pointsToPath`, `generateJaggedEllipsePath`, `generateBoltPath`, the `Vec2` type) are all unused. Removing them is what unlocks the perf win — until they're gone, the parent still re-renders on every animation tick.

Verify each before deleting: search the file for the symbol; if it has no remaining usage, delete its definition.

- [ ] **Step 1: Delete the helper functions and `Vec2` type**

Remove `Vec2` (line ~56), `midpointDisplace` (~58-78), `pointsToPath` (~80-83), `generateJaggedEllipsePath` (~85-101), `generateBoltPath` (~103-133). These are now in `atom-button.tsx`. Confirm none are referenced elsewhere in the file before deleting (they should not be — they were only used by the atom).

- [ ] **Step 2: Delete the atom state declarations**

Inside the `InfiniteGrid` function, delete these lines (originally ~185-197):

```tsx
const [atomHover, setAtomHover] = useState(false);
const atomHoverRef = useRef(false);
atomHoverRef.current = atomHover;
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
```

- [ ] **Step 3: Delete the atom rAF effect**

Delete the entire `useEffect` block from (originally) line 202 to 246 — the one that starts with `const orbitDur = 7;` and ends with `return () => cancelAnimationFrame(raf);`.

- [ ] **Step 4: Remove now-unused `useRef` import if applicable**

Check the top of the file: `import { useState, useRef, useEffect } from 'react';`. If `useRef` is no longer used anywhere in the file (search for `useRef(`), remove it from the import.

- [ ] **Step 5: Verify TypeScript**

Run: `npx tsc -b --noEmit`
Expected: No errors. If TS reports unused imports, remove them.

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: All pass.

- [ ] **Step 7: Manual perf check**

Run: `npm run dev`. Open React DevTools → Profiler. Start recording, switch between pages a few times, stop. Confirm `InfiniteGrid` re-render count is no longer dominated by atom-frequency renders. (Before this change it would re-render 60+ times/sec; after, only on user interactions.)

- [ ] **Step 8: Commit**

```bash
git add src/components/ui/infinite-grid-integration.tsx
git commit -m "perf(infinite-grid): remove inline atom state; isolation via AtomButton"
```

---

## Task 6: Create the shared `PageSkeletonShell`

**Files:**
- Create: `src/components/pages/skeletons/page-skeleton-shell.tsx`

`PageShell` (defined at `src/components/pages/page-shell.tsx`) wraps every page with `mx-auto w-full max-w-[1280px] px-6 pt-24 pb-32` and a header. The skeleton must use the **same** wrapper classes so that swapping skeleton → real page produces zero layout shift.

- [ ] **Step 1: Create the file**

```tsx
// src/components/pages/skeletons/page-skeleton-shell.tsx
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageSkeletonShellProps {
  children?: ReactNode;
  showActions?: boolean;
  className?: string;
}

export function PageSkeletonShell({
  children,
  showActions = false,
  className,
}: PageSkeletonShellProps) {
  return (
    <div
      aria-busy="true"
      aria-label="Sayfa yükleniyor"
      className={cn(
        'relative z-10 mx-auto w-full max-w-[1280px] px-6 pt-24 pb-32 animate-pulse',
        className,
      )}
    >
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="h-3 w-20 rounded bg-foreground/[0.08]" />
          <div className="h-12 w-80 max-w-full rounded-md bg-foreground/[0.10]" />
          <div className="h-3.5 w-[28rem] max-w-full rounded bg-foreground/[0.06]" />
        </div>
        {showActions && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-9 w-28 rounded-md bg-foreground/[0.08]" />
            <div className="h-9 w-24 rounded-md bg-foreground/[0.08]" />
          </div>
        )}
      </header>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/skeletons/page-skeleton-shell.tsx
git commit -m "feat(skeletons): add shared PageSkeletonShell matching PageShell layout"
```

---

## Task 7: Test PageSkeletonShell

**Files:**
- Create: `src/components/pages/skeletons/__tests__/page-skeleton-shell.test.tsx`

- [ ] **Step 1: Write the test**

```tsx
// src/components/pages/skeletons/__tests__/page-skeleton-shell.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageSkeletonShell } from '../page-skeleton-shell';

describe('PageSkeletonShell', () => {
  it('exposes aria-busy=true for accessibility', () => {
    render(<PageSkeletonShell />);
    expect(screen.getByLabelText('Sayfa yükleniyor')).toHaveAttribute('aria-busy', 'true');
  });

  it('renders children inside the shell', () => {
    render(
      <PageSkeletonShell>
        <div data-testid="content">x</div>
      </PageSkeletonShell>,
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('uses the same outer container classes as PageShell', () => {
    render(<PageSkeletonShell />);
    const shell = screen.getByLabelText('Sayfa yükleniyor');
    expect(shell.className).toContain('mx-auto');
    expect(shell.className).toContain('max-w-[1280px]');
    expect(shell.className).toContain('px-6');
    expect(shell.className).toContain('pt-24');
    expect(shell.className).toContain('pb-32');
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npx vitest run src/components/pages/skeletons/__tests__/page-skeleton-shell.test.tsx`
Expected: 3 passed.

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/skeletons/__tests__/page-skeleton-shell.test.tsx
git commit -m "test(skeletons): verify PageSkeletonShell layout and a11y"
```

---

## Task 8: Create `DashboardHomeSkeleton`

**Files:**
- Create: `src/components/pages/skeletons/dashboard-home-skeleton.tsx`

The dashboard has a hero section + stat cards + chart strip + dock shortcut grid. Skeleton matches the same vertical rhythm. No `PageSkeletonShell` here because `DashboardHome` does not use `PageShell` — it has its own layout. We mirror that structure with raw containers.

- [ ] **Step 1: Inspect DashboardHome's outer structure**

Open `src/components/ui/dashboard-home.tsx`. Look at the outer `<div>` that contains the page (top-level wrapper). Note its container classes. The skeleton's outer wrapper must match exactly.

- [ ] **Step 2: Create the skeleton**

```tsx
// src/components/pages/skeletons/dashboard-home-skeleton.tsx
import { cn } from '@/lib/utils';

export function DashboardHomeSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Sayfa yükleniyor"
      className={cn(
        'relative z-10 mx-auto w-full max-w-[1280px] px-6 pt-24 pb-32 animate-pulse',
      )}
    >
      <div className="space-y-3 mb-8">
        <div className="h-3 w-20 rounded bg-foreground/[0.08]" />
        <div className="h-12 w-96 max-w-full rounded-md bg-foreground/[0.10]" />
        <div className="h-3.5 w-[32rem] max-w-full rounded bg-foreground/[0.06]" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-3"
          >
            <div className="h-3 w-16 rounded bg-foreground/[0.08]" />
            <div className="h-7 w-24 rounded bg-foreground/[0.10]" />
            <div className="h-3 w-32 rounded bg-foreground/[0.06]" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-border/60 bg-background/40 p-4 lg:col-span-2 h-64" />
        <div className="rounded-xl border border-border/60 bg-background/40 p-4 h-64" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-background/40 h-24"
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/pages/skeletons/dashboard-home-skeleton.tsx
git commit -m "feat(skeletons): add DashboardHomeSkeleton"
```

---

## Task 9: Create `ListingsSkeleton`

**Files:**
- Create: `src/components/pages/skeletons/listings-skeleton.tsx`

Listings has filter bar + AI suggestion cards (3) + table (8 rows). Uses `PageShell`, so we wrap content in `PageSkeletonShell`.

- [ ] **Step 1: Create the file**

```tsx
// src/components/pages/skeletons/listings-skeleton.tsx
import { PageSkeletonShell } from './page-skeleton-shell';

export function ListingsSkeleton() {
  return (
    <PageSkeletonShell showActions>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="h-9 w-72 rounded-md bg-foreground/[0.08]" />
        <div className="h-9 w-24 rounded-md bg-foreground/[0.08]" />
        <div className="h-9 w-24 rounded-md bg-foreground/[0.08]" />
        <div className="h-9 w-20 rounded-md bg-foreground/[0.08] ml-auto" />
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-2"
          >
            <div className="h-3 w-16 rounded bg-foreground/[0.08]" />
            <div className="h-4 w-44 rounded bg-foreground/[0.10]" />
            <div className="h-3 w-56 rounded bg-foreground/[0.06]" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="grid grid-cols-6 gap-2 px-4 py-3 border-b border-border/60 bg-background/30">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 rounded bg-foreground/[0.08]" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, row) => (
          <div
            key={row}
            className="grid grid-cols-6 gap-2 px-4 py-3 border-b border-border/40 last:border-0"
          >
            {Array.from({ length: 6 }).map((_, col) => (
              <div key={col} className="h-3.5 rounded bg-foreground/[0.06]" />
            ))}
          </div>
        ))}
      </div>
    </PageSkeletonShell>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/skeletons/listings-skeleton.tsx
git commit -m "feat(skeletons): add ListingsSkeleton"
```

---

## Task 10: Create `CustomersSkeleton`

**Files:**
- Create: `src/components/pages/skeletons/customers-skeleton.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/pages/skeletons/customers-skeleton.tsx
import { PageSkeletonShell } from './page-skeleton-shell';

export function CustomersSkeleton() {
  return (
    <PageSkeletonShell showActions>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="h-9 w-72 rounded-md bg-foreground/[0.08]" />
        <div className="h-9 w-24 rounded-md bg-foreground/[0.08]" />
        <div className="h-9 w-20 rounded-md bg-foreground/[0.08]" />
        <div className="h-9 w-20 rounded-md bg-foreground/[0.08] ml-auto" />
      </div>

      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="grid grid-cols-7 gap-2 px-4 py-3 border-b border-border/60 bg-background/30">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-3 rounded bg-foreground/[0.08]" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, row) => (
          <div
            key={row}
            className="grid grid-cols-7 gap-2 px-4 py-3 border-b border-border/40 last:border-0"
          >
            {Array.from({ length: 7 }).map((_, col) => (
              <div key={col} className="h-3.5 rounded bg-foreground/[0.06]" />
            ))}
          </div>
        ))}
      </div>
    </PageSkeletonShell>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/skeletons/customers-skeleton.tsx
git commit -m "feat(skeletons): add CustomersSkeleton"
```

---

## Task 11: Create `FinanceSkeleton`

**Files:**
- Create: `src/components/pages/skeletons/finance-skeleton.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/pages/skeletons/finance-skeleton.tsx
import { PageSkeletonShell } from './page-skeleton-shell';

export function FinanceSkeleton() {
  return (
    <PageSkeletonShell showActions>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-3"
          >
            <div className="h-3 w-20 rounded bg-foreground/[0.08]" />
            <div className="h-7 w-32 rounded bg-foreground/[0.10]" />
            <div className="h-3 w-28 rounded bg-foreground/[0.06]" />
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-xl border border-border/60 bg-background/40 p-4 h-72" />

      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="grid grid-cols-5 gap-2 px-4 py-3 border-b border-border/60 bg-background/30">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 rounded bg-foreground/[0.08]" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, row) => (
          <div
            key={row}
            className="grid grid-cols-5 gap-2 px-4 py-3 border-b border-border/40 last:border-0"
          >
            {Array.from({ length: 5 }).map((_, col) => (
              <div key={col} className="h-3.5 rounded bg-foreground/[0.06]" />
            ))}
          </div>
        ))}
      </div>
    </PageSkeletonShell>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/skeletons/finance-skeleton.tsx
git commit -m "feat(skeletons): add FinanceSkeleton"
```

---

## Task 12: Create `ReportsSkeleton`

**Files:**
- Create: `src/components/pages/skeletons/reports-skeleton.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/pages/skeletons/reports-skeleton.tsx
import { PageSkeletonShell } from './page-skeleton-shell';

export function ReportsSkeleton() {
  return (
    <PageSkeletonShell>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-4"
          >
            <div className="h-3 w-32 rounded bg-foreground/[0.08]" />
            <div className="h-5 w-48 rounded bg-foreground/[0.10]" />
            <div className="h-48 rounded bg-foreground/[0.06]" />
          </div>
        ))}
      </div>
    </PageSkeletonShell>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/skeletons/reports-skeleton.tsx
git commit -m "feat(skeletons): add ReportsSkeleton"
```

---

## Task 13: Create `CalendarSkeleton`

**Files:**
- Create: `src/components/pages/skeletons/calendar-skeleton.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/pages/skeletons/calendar-skeleton.tsx
import { PageSkeletonShell } from './page-skeleton-shell';

export function CalendarSkeleton() {
  return (
    <PageSkeletonShell showActions>
      <div className="mb-4 flex items-center gap-3">
        <div className="h-8 w-32 rounded-md bg-foreground/[0.08]" />
        <div className="h-8 w-24 rounded-md bg-foreground/[0.08]" />
        <div className="ml-auto h-8 w-28 rounded-md bg-foreground/[0.08]" />
      </div>

      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-border/40">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="bg-background/40 px-3 py-2">
              <div className="h-3 w-10 rounded bg-foreground/[0.08]" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-border/40">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="bg-background/40 h-24 p-2">
              <div className="h-3 w-6 rounded bg-foreground/[0.06]" />
            </div>
          ))}
        </div>
      </div>
    </PageSkeletonShell>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/skeletons/calendar-skeleton.tsx
git commit -m "feat(skeletons): add CalendarSkeleton"
```

---

## Task 14: Create `MessagesSkeleton`

**Files:**
- Create: `src/components/pages/skeletons/messages-skeleton.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/pages/skeletons/messages-skeleton.tsx
import { PageSkeletonShell } from './page-skeleton-shell';

export function MessagesSkeleton() {
  return (
    <PageSkeletonShell>
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">
        <div className="rounded-xl border border-border/60 bg-background/40 p-3 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
              <div className="h-9 w-9 rounded-full bg-foreground/[0.08]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 rounded bg-foreground/[0.10]" />
                <div className="h-3 w-44 rounded bg-foreground/[0.06]" />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border/60 bg-background/40 p-4 min-h-[480px] flex flex-col gap-3">
          <div className="h-5 w-48 rounded bg-foreground/[0.10]" />
          <div className="h-3 w-32 rounded bg-foreground/[0.06]" />
          <div className="flex-1 space-y-3 pt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={i % 2 === 0 ? 'flex justify-start' : 'flex justify-end'}
              >
                <div className="h-12 w-2/3 rounded-2xl bg-foreground/[0.06]" />
              </div>
            ))}
          </div>
          <div className="h-10 w-full rounded-md bg-foreground/[0.08]" />
        </div>
      </div>
    </PageSkeletonShell>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/skeletons/messages-skeleton.tsx
git commit -m "feat(skeletons): add MessagesSkeleton"
```

---

## Task 15: Create `SearchSkeleton`

**Files:**
- Create: `src/components/pages/skeletons/search-skeleton.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/pages/skeletons/search-skeleton.tsx
import { PageSkeletonShell } from './page-skeleton-shell';

export function SearchSkeleton() {
  return (
    <PageSkeletonShell>
      <div className="mb-6">
        <div className="h-12 w-full rounded-xl bg-foreground/[0.08]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-3"
          >
            <div className="h-32 rounded-lg bg-foreground/[0.06]" />
            <div className="h-4 w-3/4 rounded bg-foreground/[0.10]" />
            <div className="h-3 w-1/2 rounded bg-foreground/[0.06]" />
            <div className="flex items-center gap-2">
              <div className="h-3 w-12 rounded bg-foreground/[0.08]" />
              <div className="h-3 w-16 rounded bg-foreground/[0.08]" />
            </div>
          </div>
        ))}
      </div>
    </PageSkeletonShell>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/skeletons/search-skeleton.tsx
git commit -m "feat(skeletons): add SearchSkeleton"
```

---

## Task 16: Create `ProfileSkeleton`

**Files:**
- Create: `src/components/pages/skeletons/profile-skeleton.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/pages/skeletons/profile-skeleton.tsx
import { PageSkeletonShell } from './page-skeleton-shell';

export function ProfileSkeleton() {
  return (
    <PageSkeletonShell>
      <div className="mb-8 rounded-xl border border-border/60 bg-background/40 p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-foreground/[0.10]" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-48 rounded bg-foreground/[0.10]" />
          <div className="h-3 w-64 rounded bg-foreground/[0.06]" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-3"
          >
            <div className="h-4 w-40 rounded bg-foreground/[0.10]" />
            <div className="h-3 w-56 rounded bg-foreground/[0.06]" />
            <div className="h-3 w-44 rounded bg-foreground/[0.06]" />
            <div className="h-9 w-32 rounded-md bg-foreground/[0.08]" />
          </div>
        ))}
      </div>
    </PageSkeletonShell>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/skeletons/profile-skeleton.tsx
git commit -m "feat(skeletons): add ProfileSkeleton"
```

---

## Task 17: Wire `pageReady` cache + skeleton routing into `InfiniteGrid`

**Files:**
- Modify: `src/components/ui/infinite-grid-integration.tsx`

This is the integration step. Add a `pageReady` state, a `useEffect` that flips it true after two `requestAnimationFrame`s for the active page, and a switch that renders the matching skeleton when not ready.

- [ ] **Step 1: Add the skeleton imports**

At the top of `infinite-grid-integration.tsx`, after the existing page imports, add:

```tsx
import { DashboardHomeSkeleton } from '@/components/pages/skeletons/dashboard-home-skeleton';
import { ListingsSkeleton } from '@/components/pages/skeletons/listings-skeleton';
import { CustomersSkeleton } from '@/components/pages/skeletons/customers-skeleton';
import { FinanceSkeleton } from '@/components/pages/skeletons/finance-skeleton';
import { ReportsSkeleton } from '@/components/pages/skeletons/reports-skeleton';
import { CalendarSkeleton } from '@/components/pages/skeletons/calendar-skeleton';
import { MessagesSkeleton } from '@/components/pages/skeletons/messages-skeleton';
import { SearchSkeleton } from '@/components/pages/skeletons/search-skeleton';
import { ProfileSkeleton } from '@/components/pages/skeletons/profile-skeleton';
```

- [ ] **Step 2: Add the `pageReady` state and effect**

Inside the `InfiniteGrid` function, near the other `useState` calls (around the section with `accountOpen`, `assistantOpen`, etc.), add:

```tsx
const [pageReady, setPageReady] = useState<Record<string, boolean>>({
  overview: true,
});

useEffect(() => {
  if (pageReady[activeDock]) return;
  let id2 = 0;
  const id1 = requestAnimationFrame(() => {
    id2 = requestAnimationFrame(() => {
      setPageReady((p) => ({ ...p, [activeDock]: true }));
    });
  });
  return () => {
    cancelAnimationFrame(id1);
    cancelAnimationFrame(id2);
  };
}, [activeDock, pageReady]);
```

- [ ] **Step 3: Replace the page render block**

Find the existing block at the bottom of `InfiniteGrid`'s return (the one that renders pages conditionally — originally near line 1014):

```tsx
<div className="absolute inset-0 z-10 overflow-y-auto overflow-x-hidden">
  {activeDock === 'overview' && <DashboardHome onNavigate={setActiveDock} />}
  {activeDock === 'listings' && <ListingsPage />}
  {activeDock === 'customers' && <CustomersPage />}
  {activeDock === 'finance' && <FinancePage />}
  {activeDock === 'reports' && <ReportsPage />}
  {activeDock === 'calendar' && <CalendarPage />}
  {activeDock === 'messages' && <MessagesPage />}
  {activeDock === 'search' && <SearchPage />}
  {activeDock === 'profile' && <ProfilePage />}
</div>
```

Replace it with:

```tsx
<div className="absolute inset-0 z-10 overflow-y-auto overflow-x-hidden">
  {!pageReady[activeDock] && (
    <>
      {activeDock === 'overview' && <DashboardHomeSkeleton />}
      {activeDock === 'listings' && <ListingsSkeleton />}
      {activeDock === 'customers' && <CustomersSkeleton />}
      {activeDock === 'finance' && <FinanceSkeleton />}
      {activeDock === 'reports' && <ReportsSkeleton />}
      {activeDock === 'calendar' && <CalendarSkeleton />}
      {activeDock === 'messages' && <MessagesSkeleton />}
      {activeDock === 'search' && <SearchSkeleton />}
      {activeDock === 'profile' && <ProfileSkeleton />}
    </>
  )}
  {pageReady[activeDock] && (
    <>
      {activeDock === 'overview' && <DashboardHome onNavigate={setActiveDock} />}
      {activeDock === 'listings' && <ListingsPage />}
      {activeDock === 'customers' && <CustomersPage />}
      {activeDock === 'finance' && <FinancePage />}
      {activeDock === 'reports' && <ReportsPage />}
      {activeDock === 'calendar' && <CalendarPage />}
      {activeDock === 'messages' && <MessagesPage />}
      {activeDock === 'search' && <SearchPage />}
      {activeDock === 'profile' && <ProfilePage />}
    </>
  )}
</div>
```

- [ ] **Step 4: Verify TypeScript**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 5: Run all tests**

Run: `npx vitest run`
Expected: All pass.

- [ ] **Step 6: Manual smoke test — every page**

Run: `npm run dev`. Open the app. From the dock or header nav, click each page in turn: listings, customers, finance, reports, calendar, messages, search, profile, then back to overview. For each transition: skeleton should flash for one frame, then real page appears with no layout jump.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/infinite-grid-integration.tsx
git commit -m "feat(infinite-grid): add pageReady cache + skeleton routing for transitions"
```

---

## Task 18: Add fade-in to real-page render to soften skeleton handoff

**Files:**
- Modify: `src/components/ui/infinite-grid-integration.tsx`

The skeleton already paints in frame 0 and the real page mounts in frame 2. The handoff is visible. Wrap the real-page block in a `motion.div` with a 150ms opacity fade so the swap feels smooth.

- [ ] **Step 1: Confirm `motion` is already imported**

Top of `infinite-grid-integration.tsx` should already have `motion` from `framer-motion` (it's used elsewhere in the file). If not, add it.

- [ ] **Step 2: Wrap the real-page block**

In the page render block from Task 17 Step 3, replace the second `<>...</>` (the `pageReady[activeDock] && (...)` branch) with:

```tsx
{pageReady[activeDock] && (
  <motion.div
    key={activeDock}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.15, ease: 'easeOut' }}
  >
    {activeDock === 'overview' && <DashboardHome onNavigate={setActiveDock} />}
    {activeDock === 'listings' && <ListingsPage />}
    {activeDock === 'customers' && <CustomersPage />}
    {activeDock === 'finance' && <FinancePage />}
    {activeDock === 'reports' && <ReportsPage />}
    {activeDock === 'calendar' && <CalendarPage />}
    {activeDock === 'messages' && <MessagesPage />}
    {activeDock === 'search' && <SearchPage />}
    {activeDock === 'profile' && <ProfilePage />}
  </motion.div>
)}
```

The `key={activeDock}` ensures the animation replays whenever the active page changes. The wrapper renders as a plain `div` inside the existing scroll container — children flow normally and inherit the same outer container classes already present in each page (so no layout shift relative to the skeleton).

- [ ] **Step 3: Verify TypeScript and tests**

Run: `npx tsc -b --noEmit && npx vitest run`
Expected: All pass.

- [ ] **Step 4: Manual UX test**

Run: `npm run dev`. Switch between pages. The transition should feel: skeleton appears → 150ms fade reveals the real page over the skeleton's last frame → skeleton vanishes. No visible flash, no layout jump.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/infinite-grid-integration.tsx
git commit -m "feat(infinite-grid): fade real page in over skeleton for smooth handoff"
```

---

## Task 19: Final verification

**Files:** none modified.

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: All tests pass (including the new atom-button and page-skeleton-shell tests).

- [ ] **Step 2: Run a production build**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: No new errors introduced.

- [ ] **Step 4: Manual perf verification**

Run: `npm run dev`. Open Chrome DevTools → Performance tab. Start recording. Click 4 different page tabs in the header dock with ~1 second between each. Stop recording.

Look for:
- No long tasks (>50ms) at the moment of click; the skeleton paint should be cheap
- Atom animation continues running but does not appear in the React commit timeline for `InfiniteGrid` after Task 5
- Smooth 60fps during the page transitions

- [ ] **Step 5: Manual UX verification across all 9 pages**

Visit each page in turn (overview → listings → customers → finance → reports → calendar → messages → search → profile → overview). Confirm:
- No "donma" feeling on click
- Skeleton appears immediately (first frame), real content fades in
- No layout shift when content arrives
- Atom button (bottom-right) keeps animating throughout
- Re-visiting a previously-loaded page should NOT show the skeleton again

- [ ] **Step 6: Commit any final cleanup**

If lint or build surfaced minor cleanups, address them and commit.
