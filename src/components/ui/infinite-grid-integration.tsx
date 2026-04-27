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
  Settings2,
  SlidersHorizontal,
  Gauge,
  Aperture,
  X,
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassDock, GlassDockVertical, GlassEffect, GlassFilter, type DockIcon } from '@/components/ui/liquid-glass';
import { GlassButton } from '@/components/ui/glass-button';
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
  const [gridSize, setGridSize] = useState(40);
  const [speed, setSpeed] = useState(0.5);
  const [revealRadius, setRevealRadius] = useState(300);
  const [panelOpen, setPanelOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());
  const [activeDock, setActiveDock] = useState<string>('overview');
  const [mobileDockOpen, setMobileDockOpen] = useState(false);
  const { customers, transactions, conversations } = useStore();
  const hotCount = customers.filter((c) => c.segment === 'Sıcak').length;
  const pendingDocs = transactions.filter((t) => t.status === 'Kaparo' || t.status === 'Teklif').length;
  const todayDeposits = transactions.filter((t) => t.status === 'Kaparo').length;
  const unreadCount = conversations.filter((c) => c.unread).length;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const timeLabel = now.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
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
    { key: 'overview', alt: 'Gösterge', icon: <LayoutGrid className="w-6 h-6" /> },
    { key: 'listings', alt: 'İlanlar', icon: <Layers className="w-6 h-6" /> },
    { key: 'customers', alt: 'Müşteriler', icon: <Users className="w-6 h-6" /> },
    { key: 'finance', alt: 'Finans', icon: <Wallet className="w-6 h-6" /> },
    { key: 'reports', alt: 'Raporlar', icon: <BarChart3 className="w-6 h-6" /> },
    { key: 'calendar', alt: 'Takvim', icon: <Calendar className="w-6 h-6" /> },
    { key: 'messages', alt: 'Mesajlar', icon: <MessageSquare className="w-6 h-6" /> },
    { key: 'search', alt: 'Ara', icon: <Search className="w-6 h-6" /> },
    { key: 'profile', alt: 'Profil', icon: <User className="w-6 h-6" /> },
  ];

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
          {panelOpen && (
            <motion.div
              key="control-panel"
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="origin-bottom-left flex flex-col gap-3 w-[240px]"
            >
              <div className="bg-background/80 backdrop-blur-md border border-border p-4 rounded-xl shadow-2xl space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <SlidersHorizontal className="w-4 h-4" />
                  Tweaks
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                    <span className="flex items-center gap-1.5 text-foreground/80">
                      <Gauge className="w-3 h-3" />
                      Speed
                    </span>
                    <span>{speed.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.05"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                    <span className="flex items-center gap-1.5 text-foreground/80">
                      <Aperture className="w-3 h-3" />
                      Reveal
                    </span>
                    <span>{revealRadius}px</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="700"
                    value={revealRadius}
                    onChange={(e) => setRevealRadius(Number(e.target.value))}
                    className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              <div className="bg-background/80 backdrop-blur-md border border-border p-4 rounded-xl shadow-2xl space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Settings2 className="w-4 h-4" />
                  Grid Density
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={gridSize}
                  onChange={(e) => setGridSize(Number(e.target.value))}
                  className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                  <span>Dense</span>
                  <span>Sparse ({gridSize}px)</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setPanelOpen((v) => !v)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          aria-label={panelOpen ? 'Close controls' : 'Open controls'}
          aria-expanded={panelOpen}
          className="w-11 h-11 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-background transition-colors"
        >
          <AnimatePresence mode="wait" initial={false}>
            {panelOpen ? (
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

      <div className="fixed top-0 left-6 right-6 lg:left-12 lg:right-12 xl:left-20 xl:right-20 z-30 pointer-events-auto">
        <GlassEffect className="rounded-t-none rounded-b-3xl px-6 py-3 w-full">
          <div className="flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => setActiveDock('overview')}
              aria-label="Anasayfaya dön"
              className="flex items-center gap-3 min-w-0 rounded-xl px-1 py-0.5 -ml-1 transition-colors hover:bg-background/40"
            >
              <Sparkles className="w-5 h-5 flex-none" />
              <span className="text-base font-semibold tracking-tight">sahibinden</span>
              <span className="hidden md:inline-block h-5 w-px bg-border" aria-hidden="true" />
              <div className="hidden md:flex flex-col leading-tight text-left">
                <span className="text-sm font-medium">Tuna</span>
                <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
                  Atölye · IST
                </span>
              </div>
            </button>

            <div
              role="toolbar"
              aria-label="Canlı durum"
              className="hidden lg:flex items-center gap-2 flex-none"
            >
              <button
                type="button"
                title="Sıcak görüşmeler — kaparoya yakın"
                onClick={() => setActiveDock('customers')}
                className="group flex items-center gap-2 rounded-full border border-border/60 bg-background/30 px-3 py-1.5 backdrop-blur-md transition-colors hover:bg-background/60"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-300 shadow-[0_0_8px_currentColor]" />
                <span className="text-sm font-medium tabular-nums">{hotCount}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  sıcak görüşme
                </span>
              </button>

              <button
                type="button"
                title="Tapu işlemi 7 gün+ bekleyen evraklar"
                onClick={() => setActiveDock('finance')}
                className="group flex items-center gap-2 rounded-full border border-border/60 bg-background/30 px-3 py-1.5 backdrop-blur-md transition-colors hover:bg-background/60"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-400 shadow-[0_0_8px_currentColor]" />
                <span className="text-sm font-medium tabular-nums">{pendingDocs}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  bekleyen evrak
                </span>
              </button>

              <button
                type="button"
                title="Bugün gelen kaparolar"
                onClick={() => setActiveDock('finance')}
                className="group flex items-center gap-2 rounded-full border border-border/60 bg-background/30 px-3 py-1.5 backdrop-blur-md transition-colors hover:bg-background/60"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shadow-[0_0_8px_currentColor]" />
                <span className="text-sm font-medium tabular-nums">{todayDeposits}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  kaparo bugün
                </span>
              </button>

              <button
                type="button"
                title="Haftalık ciro · geçen haftaya göre"
                onClick={() => setActiveDock('reports')}
                className="group flex items-center gap-2 rounded-full border border-border/60 bg-background/30 px-3 py-1.5 backdrop-blur-md transition-colors hover:bg-background/60"
              >
                <svg
                  viewBox="0 0 36 14"
                  className="h-3 w-9 text-emerald-700 dark:text-emerald-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="0,11 6,9 12,10 18,6 24,7 30,3 36,4" />
                </svg>
                <span className="text-sm font-medium tabular-nums text-emerald-700 dark:text-emerald-300">
                  +18%
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  bu hafta
                </span>
              </button>
            </div>

            <div className="flex-1" aria-hidden="true" />

            <div className="flex items-center gap-2 flex-none">
              <span
                aria-label="Canlı saat"
                className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/30 px-3 py-1.5 backdrop-blur-md"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Canlı
                </span>
                <span className="font-mono text-xs tabular-nums tracking-wider">
                  {timeLabel}
                </span>
              </span>

              <button
                type="button"
                onClick={onToggleTheme}
                aria-label="Temayı değiştir"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-background/30 hover:bg-background/60 transition-colors"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-stone-200" />
                ) : (
                  <Moon className="w-4 h-4 text-stone-700" />
                )}
              </button>

              <button
                type="button"
                aria-label="Bildirimler"
                onClick={() => setActiveDock('messages')}
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

              <button
                type="button"
                aria-label="Profil"
                onClick={() => setActiveDock('profile')}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-background/30 hover:bg-background/60 transition-colors text-sm font-medium"
              >
                T
              </button>
            </div>
          </div>
        </GlassEffect>
      </div>

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

      <div className="fixed bottom-20 right-6 z-40 pointer-events-auto">
        <GlassButton
          size="icon"
          aria-label="Yapay zeka asistanı"
          onClick={() => setAssistantOpen(true)}
          className="!h-14 !w-14 sm:!h-16 sm:!w-16 md:!h-[4.5rem] md:!w-[4.5rem]"
          buttonClassName="!h-14 !w-14 sm:!h-16 sm:!w-16 md:!h-[4.5rem] md:!w-[4.5rem]"
          contentClassName="!h-14 !w-14 sm:!h-16 sm:!w-16 md:!h-[4.5rem] md:!w-[4.5rem]"
        >
          <motion.svg
            viewBox="-30 -30 60 60"
            aria-hidden="true"
            className="text-neutral-900 dark:text-neutral-100"
            animate={{ scale: [1, 1.12, 1] }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ transformOrigin: 'center' }}
          >
            <defs>
              <radialGradient id="atom-nucleus" cx="32%" cy="28%" r="75%">
                <stop offset="0%" stopColor="#8d6e63" />
                <stop offset="55%" stopColor="#4e342e" />
                <stop offset="100%" stopColor="#2a1a14" />
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
            </defs>

            <g filter="url(#atom-depth)">
              {[0, 60, 120].map((angle, i) => (
                <g key={angle} transform={`rotate(${angle})`}>
                  <ellipse
                    cx="0"
                    cy="0.5"
                    rx="22"
                    ry="9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    opacity="0.35"
                  />
                  <ellipse
                    cx="0"
                    cy="0"
                    rx="22"
                    ry="9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <ellipse
                    cx="0"
                    cy="-0.45"
                    rx="22"
                    ry="9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.55"
                    strokeLinecap="round"
                    opacity="0.55"
                  />
                  <circle r="1.8" fill="currentColor">
                    <animateMotion
                      dur="2.4s"
                      repeatCount="indefinite"
                      begin={`${i * -0.8}s`}
                      path="M22,0 A22,9 0 1,1 -22,0 A22,9 0 1,1 22,0"
                    />
                  </circle>
                </g>
              ))}

              <circle cx="0" cy="0" r="4" fill="url(#atom-nucleus)" />
            </g>
          </motion.svg>
        </GlassButton>
      </div>

      <AssistantModal
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        onPickModule={(target) => setActiveDock(target)}
      />

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
