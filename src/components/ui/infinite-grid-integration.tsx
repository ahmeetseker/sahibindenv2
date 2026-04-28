import { useState, useRef, useEffect } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionTemplate,
  useAnimationFrame,
  type MotionValue,
} from 'framer-motion';
import {
  Sun,
  Moon,
  Bell,
  LayoutGrid,
  Layers,
  Users,
  Wallet,
  BarChart3,
  Calendar,
  MessageSquare,
  Search,
  User,
  Sparkles,
  SlidersHorizontal,
  X,
  Settings2,
  Building2,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassDock, GlassDockVertical, GlassEffect, GlassFilter, type DockIcon } from '@/components/ui/liquid-glass';
import { GlassButton } from '@/components/ui/glass-button';
import { AtomButton } from '@/components/ui/atom-button';
import { DashboardHome } from '@/components/ui/dashboard-home';
import { ListingsPage } from '@/components/pages/listings';
import { CustomersPage } from '@/components/pages/customers';
import { FinancePage } from '@/components/pages/finance';
import { ReportsPage } from '@/components/pages/reports';
import { CalendarPage } from '@/components/pages/calendar';
import { MessagesPage } from '@/components/pages/messages';
import { SearchPage } from '@/components/pages/search';
import { ProfilePage } from '@/components/pages/profile';
import { AssistantModal } from '@/components/ui/assistant/assistant-modal';
import { useStore } from '@/lib/store';
import {
  PROFILE_SHORTCUT_IDS,
  PROFILE_OPEN_MODAL_EVENT,
  type ProfileShortcutId,
} from '@/components/pages/profile-shortcuts';
import {
  Dialog,
  buttonGhost,
  buttonDanger,
} from '@/components/ui/dialog';

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

const generateJaggedEllipsePath = (
  rx: number,
  ry: number,
  segments: number,
  jitter: number,
): string => {
  const pts: Vec2[] = [];
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * 2 * Math.PI;
    const j = 1 + (Math.random() - 0.5) * jitter;
    pts.push({ x: rx * j * Math.cos(theta), y: ry * j * Math.sin(theta) });
  }
  pts.push(pts[0]);
  return pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ');
};

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

const GridPattern = ({
  offsetX,
  offsetY,
  size,
}: {
  offsetX: MotionValue<number>;
  offsetY: MotionValue<number>;
  size: number;
}) => {
  return (
    <svg className="w-full h-full">
      <defs>
        <motion.pattern
          id="grid-pattern"
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <path
            d={`M ${size} 0 L 0 0 0 ${size}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-muted-foreground"
          />
        </motion.pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-pattern)" />
    </svg>
  );
};

const InfiniteGrid = ({
  isDark,
  onToggleTheme,
}: {
  isDark: boolean;
  onToggleTheme: () => void;
}) => {
  const gridSize = 24;
  const speed = 0.35;
  const revealRadius = 240;
  const [accountOpen, setAccountOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());
  const [activeDock, setActiveDock] = useState<string>('overview');
  const [mobileDockOpen, setMobileDockOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
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
  const { conversations, resetStore } = useStore();
  const unreadCount = conversations.filter((c) => c.unread).length;
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  const [signoutOpen, setSignoutOpen] = useState(false);

  const openProfileShortcut = (sectionId: ProfileShortcutId) => {
    setActiveDock('profile');
    setAccountOpen(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.dispatchEvent(
          new CustomEvent<ProfileShortcutId>(PROFILE_OPEN_MODAL_EVENT, {
            detail: sectionId,
          }),
        );
      });
    });
  };

  const goToProfile = () => {
    setActiveDock('profile');
    setAccountOpen(false);
  };

  const timeLabel = now.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  const gridOffsetX = useMotionValue(0);
  const gridOffsetY = useMotionValue(0);

  useAnimationFrame(() => {
    const currentX = gridOffsetX.get();
    const currentY = gridOffsetY.get();
    gridOffsetX.set((currentX + speed) % gridSize);
    gridOffsetY.set((currentY + speed) % gridSize);
  });

  const maskImage = useMotionTemplate`radial-gradient(${revealRadius}px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

  const dockPages: { key: string; alt: string; icon: React.ReactNode }[] = [
    { key: 'overview', alt: 'Gösterge', icon: <LayoutGrid className="w-5 h-5" /> },
    { key: 'listings', alt: 'İlanlar', icon: <Layers className="w-5 h-5" /> },
    { key: 'customers', alt: 'Müşteriler', icon: <Users className="w-5 h-5" /> },
    { key: 'finance', alt: 'Finans', icon: <Wallet className="w-5 h-5" /> },
    { key: 'reports', alt: 'Raporlar', icon: <BarChart3 className="w-5 h-5" /> },
    { key: 'calendar', alt: 'Takvim', icon: <Calendar className="w-5 h-5" /> },
    { key: 'messages', alt: 'Mesajlar', icon: <MessageSquare className="w-5 h-5" /> },
    { key: 'search', alt: 'Ara', icon: <Search className="w-5 h-5" /> },
    { key: 'profile', alt: 'Profil', icon: <User className="w-5 h-5" /> },
  ];

  const navPages = dockPages.filter((p) =>
    ['overview', 'listings', 'customers', 'finance', 'reports', 'calendar'].includes(p.key)
  );

  const activePageLabel =
    dockPages.find((p) => p.key === activeDock)?.alt ?? 'Gösterge';

  const dockIcons: DockIcon[] = dockPages.map((p) => ({
    alt: p.alt,
    label: p.alt,
    icon: p.icon,
    active: activeDock === p.key,
    onClick: () => setActiveDock(p.key),
  }));

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        'relative w-full h-screen overflow-hidden bg-background'
      )}
    >
      <GlassFilter />
      <div className="absolute inset-0 z-0 opacity-[0.05]">
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} size={gridSize} />
      </div>

      <motion.div
        className="absolute inset-0 z-0 opacity-40"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} size={gridSize} />
      </motion.div>

      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute right-[-20%] top-[-20%] w-[40%] h-[40%] rounded-full bg-stone-300/40 dark:bg-stone-700/25 blur-[120px]" />
        <div className="absolute right-[10%] top-[-10%] w-[20%] h-[20%] rounded-full bg-primary/30 blur-[100px]" />
        <div className="absolute left-[-10%] bottom-[-20%] w-[40%] h-[40%] rounded-full bg-stone-400/30 dark:bg-stone-600/20 blur-[120px]" />
      </div>

      <div className="absolute bottom-6 left-6 z-30 pointer-events-auto flex flex-col items-start gap-3">
        <AnimatePresence>
          {accountOpen && (
            <>
              <motion.div
                key="account-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setAccountOpen(false)}
                className="fixed inset-0 z-[-1]"
                aria-hidden="true"
              />
              <motion.div
                key="account-menu"
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                role="menu"
                aria-label="Atölye kısayolları"
                className="origin-bottom-left w-[300px] overflow-hidden rounded-xl border border-border bg-background/85 backdrop-blur-xl shadow-2xl"
              >
                <div className="px-4 py-3 border-b border-border/60">
                  <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
                    Hesap kısayolları
                  </div>
                  <div className="mt-0.5 text-sm text-foreground">
                    Sık kullanılan ayarlar
                  </div>
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={goToProfile}
                  className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-foreground/[0.06] border-b border-border/60"
                >
                  <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-stone-700/10 text-sm font-semibold text-stone-800 dark:bg-stone-200/10 dark:text-stone-200">
                    T
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">Profilim</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Tuna Yıldız · Atölye Yöneticisi
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 flex-none text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                </button>

                <nav className="p-2 grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => openProfileShortcut(PROFILE_SHORTCUT_IDS.general)}
                    className="group flex items-start gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-foreground/[0.06]"
                  >
                    <div className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-stone-700/10 text-stone-800 dark:bg-stone-200/10 dark:text-stone-200">
                      <Settings2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">Genel ayarlar</p>
                      <p className="text-[11px] text-muted-foreground truncate">Dil, tema, bildirim sesleri</p>
                    </div>
                    <ChevronRight className="mt-1.5 h-3.5 w-3.5 flex-none text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => openProfileShortcut(PROFILE_SHORTCUT_IDS.workshop)}
                    className="group flex items-start gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-foreground/[0.06]"
                  >
                    <div className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-stone-700/10 text-stone-800 dark:bg-stone-200/10 dark:text-stone-200">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">Atölye bilgisi</p>
                      <p className="text-[11px] text-muted-foreground truncate">İletişim, vergi numarası, logo</p>
                    </div>
                    <ChevronRight className="mt-1.5 h-3.5 w-3.5 flex-none text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => openProfileShortcut(PROFILE_SHORTCUT_IDS.team)}
                    className="group flex items-start gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-foreground/[0.06]"
                  >
                    <div className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-stone-700/10 text-stone-800 dark:bg-stone-200/10 dark:text-stone-200">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">Ekip & rol</p>
                      <p className="text-[11px] text-muted-foreground truncate">4 kişilik ekip · roller</p>
                    </div>
                    <ChevronRight className="mt-1.5 h-3.5 w-3.5 flex-none text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => openProfileShortcut(PROFILE_SHORTCUT_IDS.notifications)}
                    className="group flex items-start gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-foreground/[0.06]"
                  >
                    <div className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-stone-700/10 text-stone-800 dark:bg-stone-200/10 dark:text-stone-200">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">Bildirim tercihleri</p>
                      <p className="text-[11px] text-muted-foreground truncate">Sıcak müşteri, evrak, kaparo</p>
                    </div>
                    {unreadCount > 0 && (
                      <span className="mt-1 font-mono text-[10px] tabular-nums tracking-wider text-muted-foreground">
                        {unreadCount}
                      </span>
                    )}
                    <ChevronRight className="mt-1.5 h-3.5 w-3.5 flex-none text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                  </button>

                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={isDark}
                    onClick={onToggleTheme}
                    className="group flex items-start gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-foreground/[0.06]"
                  >
                    <div className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-stone-700/10 text-stone-800 dark:bg-stone-200/10 dark:text-stone-200">
                      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">Karanlık mod</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
                      </p>
                    </div>
                    <span
                      aria-hidden="true"
                      className={cn(
                        'mt-1 flex h-4 w-7 flex-none items-center rounded-full border border-border/70 px-0.5 transition-colors',
                        isDark ? 'bg-foreground/80 justify-end' : 'bg-background/40 justify-start'
                      )}
                    >
                      <span
                        className={cn(
                          'h-3 w-3 rounded-full transition-colors',
                          isDark ? 'bg-background' : 'bg-foreground/70'
                        )}
                      />
                    </span>
                  </button>
                </nav>

                <div className="border-t border-border/60" />

                <button
                  type="button"
                  onClick={goToProfile}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-foreground/[0.06] transition-colors"
                >
                  <span className="text-muted-foreground">Tüm hesap ayarları</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>

                <div className="border-t border-border/60" />

                <button
                  type="button"
                  onClick={() => {
                    setAccountOpen(false);
                    setSignoutOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-700 dark:text-red-300 hover:bg-red-600/[0.08] transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="flex-1 text-left">Çıkış yap</span>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setAccountOpen((v) => !v)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          aria-label={accountOpen ? 'Kısayolları kapat' : 'Kısayolları aç'}
          aria-expanded={accountOpen}
          aria-haspopup="menu"
          className="w-11 h-11 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-background transition-colors"
        >
          <AnimatePresence mode="wait" initial={false}>
            {accountOpen ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex"
              >
                <X className="w-4 h-4" />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <AnimatePresence>
        {navOpen && (
          <motion.div
            key="nav-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setNavOpen(false)}
            className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.div
        layout
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        animate={{ borderRadius: navOpen ? 28 : 999 }}
        className="fixed top-4 left-1/2 z-40 pointer-events-auto overflow-hidden border border-border/70 bg-background/80 shadow-[0_8px_24px_rgba(80,60,40,0.1),0_0_16px_rgba(80,60,40,0.05)] dark:bg-stone-900/70 dark:shadow-[0_8px_24px_rgba(20,14,10,0.45),0_0_24px_rgba(20,14,10,0.22)]"
        style={{
          x: '-50%',
          width: navOpen ? 'min(94vw, 580px)' : 'min(92vw, 500px)',
          backdropFilter: 'blur(14px) saturate(180%)',
          WebkitBackdropFilter: 'blur(14px) saturate(180%)',
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {!navOpen ? (
            <motion.div
              key="pill"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              role="button"
              tabIndex={0}
              aria-label="Hızlı gezinme"
              aria-haspopup="dialog"
              aria-expanded={navOpen}
              onClick={() => setNavOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setNavOpen(true);
                }
              }}
              className="flex items-center justify-between gap-4 w-full px-5 py-2 cursor-pointer hover:bg-foreground/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Sparkles className="w-6 h-6 flex-none" />
                <span className="text-sm font-semibold tracking-tight">sahibinden</span>
              </div>

              <div className="flex items-center gap-2 flex-none">
                <span
                  aria-label={`Şu an: ${activePageLabel}`}
                  className="hidden sm:inline-flex items-center gap-2.5 rounded-full border border-border/60 bg-background/30 pl-3 pr-3.5 py-1.5 backdrop-blur-md"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  </span>
                  <span className="text-xs leading-none">
                    <span className="text-muted-foreground">Şu an: </span>
                    <span className="font-medium text-foreground">{activePageLabel}</span>
                  </span>
                  <span className="h-3 w-px bg-border/70" aria-hidden="true" />
                  <span className="font-mono text-xs tabular-nums tracking-wider text-muted-foreground">
                    {timeLabel}
                  </span>
                </span>

                <button
                  type="button"
                  aria-label="Bildirimler"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDock('messages');
                    setNavOpen(false);
                  }}
                  className="relative flex items-center justify-center w-9 h-9 rounded-full bg-background/30 hover:bg-background/60 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 font-mono text-[9px] font-medium tabular-nums text-white dark:bg-red-400 dark:text-stone-900"
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="body"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.55, delay: 0.15, ease: [0.32, 0.72, 0, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Hızlı gezinme"
              className="flex flex-col px-5 py-4 gap-3"
            >
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/60">
                <h2 className="text-base font-semibold text-foreground leading-none">
                  Nereye gitmek istersin?
                </h2>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNavOpen(false);
                  }}
                  aria-label="Kapat"
                  className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-background/40 text-muted-foreground transition-all hover:bg-foreground/[0.08] hover:text-foreground hover:rotate-90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {navPages.map((p) => {
                  const isActive = activeDock === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDock(p.key);
                        setNavOpen(false);
                      }}
                      className={cn(
                        'group relative flex flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-4 text-center transition-all',
                        isActive
                          ? 'border-foreground/60 bg-foreground/[0.08] text-foreground shadow-inner'
                          : 'border-border/60 bg-background/40 text-foreground/85 hover:-translate-y-0.5 hover:border-foreground/40 hover:bg-foreground/[0.05]'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                          isActive
                            ? 'bg-foreground/10 text-foreground'
                            : 'bg-stone-700/10 text-stone-800 dark:bg-stone-200/10 dark:text-stone-200 group-hover:bg-foreground/10'
                        )}
                      >
                        {p.icon}
                      </span>
                      <span className="text-sm font-medium leading-none">{p.alt}</span>
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shadow-[0_0_8px_currentColor]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="dock-reveal group absolute bottom-0 left-1/2 z-30 hidden h-24 w-[460px] max-w-[92vw] -translate-x-1/2 items-end justify-center pointer-events-none md:flex">
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-1/2 h-5 w-[140px] -translate-x-1/2 pointer-events-auto"
        />

        <span
          aria-hidden="true"
          className="dock-hint absolute bottom-0 left-1/2 h-[10px] w-[140px] rounded-t-xl bg-foreground/55"
        />

        <div className="dock-stage relative mb-3 origin-bottom translate-y-[calc(100%+60px)] scale-90 opacity-0 transition-all duration-[600ms] ease-[cubic-bezier(0.34,1.15,0.5,1)] pointer-events-none group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-hover:pointer-events-auto">
          <GlassDock icons={dockIcons} />
        </div>
      </div>

      {/* Mobile vertical dock hint — right edge, tap-to-toggle */}
      <button
        type="button"
        aria-label={mobileDockOpen ? 'Modülleri kapat' : 'Modülleri aç'}
        aria-expanded={mobileDockOpen}
        onClick={() => setMobileDockOpen((v) => !v)}
        className="dock-hint-v fixed right-0 top-1/2 z-30 h-[140px] w-[10px] rounded-l-xl bg-foreground/55 md:hidden"
      />

      {/* Mobile vertical dock stage */}
      <div
        className={`fixed right-3 top-1/2 z-30 origin-right transition-all duration-[500ms] ease-[cubic-bezier(0.34,1.15,0.5,1)] md:hidden ${mobileDockOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          }`}
        style={{
          transform: mobileDockOpen
            ? 'translate(0, -50%) scale(1)'
            : 'translate(calc(100% + 40px), -50%) scale(0.9)',
        }}
      >
        <GlassDockVertical icons={dockIcons} onIconClick={() => setMobileDockOpen(false)} />
      </div>

      {/* Tap-outside overlay to dismiss mobile dock */}
      {mobileDockOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMobileDockOpen(false)}
          className="fixed inset-0 z-20 md:hidden"
        />
      )}

      <AtomButton onClick={() => setAssistantOpen(true)} />

      <AssistantModal
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        onPickModule={(target) => setActiveDock(target)}
      />

      <Dialog
        open={signoutOpen}
        onClose={() => setSignoutOpen(false)}
        size="sm"
        title="Çıkış yap"
        description="Hesaptan çıkmak üzeresin. Yerel demo verisi de sıfırlanır."
        footer={
          <>
            <button
              type="button"
              onClick={() => setSignoutOpen(false)}
              className={buttonGhost}
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={() => {
                resetStore();
                setSignoutOpen(false);
                setActiveDock('overview');
              }}
              className={buttonDanger}
            >
              <LogOut className="h-3.5 w-3.5" />
              Çıkış yap
            </button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Bu cihazdaki oturumun sonlandırılır ve atölye verisi başlangıç hâline döner.
        </p>
      </Dialog>

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
    </div>
  );
};

const App: React.FC = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = window.localStorage.getItem('atelier-theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
    } catch {
      /* noop */
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      window.localStorage.setItem('atelier-theme', isDark ? 'dark' : 'light');
    } catch {
      /* noop */
    }
  }, [isDark]);

  return (
    <div className="w-full relative min-h-screen">
      <main>
        <InfiniteGrid isDark={isDark} onToggleTheme={() => setIsDark((v) => !v)} />
      </main>

    </div>
  );
};

export default App;
