import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AssistantBlock, IntentName } from "./assistant/types";

export type ListingStatus = "Aktif" | "Taslak" | "Pasif";
export interface Listing {
  id: string;
  loc: string;
  area: string;
  price: string;
  views: number;
  status: ListingStatus;
  tag?: string;
  lat?: number;
  lng?: number;
}

export type CustomerSegment = "Sıcak" | "Ilık" | "Soğuk";
export type CustomerStage =
  | "İlk temas"
  | "Görüşme"
  | "Teklif"
  | "Kaparo"
  | "Tapu";
export interface Customer {
  id: string;
  name: string;
  interest: string;
  budget: string;
  stage: CustomerStage;
  last: string;
  segment: CustomerSegment;
}

export type TransactionStatus = "Görüşme" | "Teklif" | "Kaparo" | "Tapu tamam";
export interface Transaction {
  id: string;
  customerId: string;
  customer: string;
  listing: string;
  amount: string;
  date: string;
  status: TransactionStatus;
}

export type CalendarType = "saha" | "tapu" | "gorusme";
export interface CalendarEvent {
  id: string;
  day: "Pzt" | "Sal" | "Çar" | "Per" | "Cum" | "Cmt" | "Paz";
  time: string;
  title: string;
  type: CalendarType;
  loc?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  time: string;
  mine: boolean;
}
export interface Conversation {
  id: string;
  name: string;
  customerId?: string;
  last: string;
  time: string;
  unread: boolean;
  ai?: boolean;
  messages: ChatMessage[];
}

export interface Profile {
  name: string;
  role: string;
  workshop: string;
  email: string;
  phone: string;
  city: string;
}

export interface ActivityEntry {
  id: string;
  time: string;
  text: string;
  tone: "accent" | "muted" | "success";
}

export interface AssistantChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  blocks?: AssistantBlock[];
  intent?: IntentName;
  createdAt: string;
}

export interface AssistantSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AssistantChatMessage[];
}

interface StoreState {
  listings: Listing[];
  customers: Customer[];
  transactions: Transaction[];
  events: CalendarEvent[];
  conversations: Conversation[];
  profile: Profile;
  activity: ActivityEntry[];
  assistantSessions: AssistantSession[];
  activeAssistantSessionId: string | null;
}

interface StoreActions {
  // Listings
  addListing: (l: Omit<Listing, "id" | "views">) => void;
  updateListing: (id: string, patch: Partial<Listing>) => void;
  deleteListing: (id: string) => void;
  // Customers
  addCustomer: (c: Omit<Customer, "id" | "last">) => void;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  // Transactions
  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  // Events
  addEvent: (e: Omit<CalendarEvent, "id">) => void;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  // Messages
  setActiveConversation: (id: string) => void;
  sendMessage: (conversationId: string, text: string) => void;
  markConversationRead: (conversationId: string) => void;
  // Profile
  updateProfile: (patch: Partial<Profile>) => void;
  // Activity
  pushActivity: (text: string, tone?: ActivityEntry["tone"]) => void;
  // Assistant
  startAssistantSession: () => string;
  setActiveAssistantSession: (id: string) => void;
  appendAssistantMessage: (
    sessionId: string,
    msg: Omit<AssistantChatMessage, "id" | "createdAt">,
  ) => string;
  renameAssistantSession: (id: string, title: string) => void;
  deleteAssistantSession: (id: string) => void;
  clearAssistantSessions: () => void;
  // Misc
  resetStore: () => void;
}

interface StoreContextType extends StoreState, StoreActions {
  activeConversationId: string;
}

const initialListings: Listing[] = [
  { id: "ARS-0142", loc: "Ayvacık / Çanakkale", area: "8.250 m²", price: "₺1.8M", views: 412, status: "Aktif", tag: "Deniz manzaralı", lat: 39.604, lng: 26.405 },
  { id: "ARS-0139", loc: "Datça / Muğla", area: "4.100 m²", price: "₺2.2M", views: 388, status: "Aktif", tag: "Koy önü", lat: 36.732, lng: 27.685 },
  { id: "ARS-0137", loc: "Cunda / Balıkesir", area: "5.600 m²", price: "₺1.2M", views: 364, status: "Aktif", tag: "Zeytinlik", lat: 39.347, lng: 26.671 },
  { id: "ARS-0134", loc: "Söke / Aydın", area: "12.400 m²", price: "₺950K", views: 298, status: "Aktif", tag: "Yola cephe", lat: 37.749, lng: 27.408 },
  { id: "ARS-0131", loc: "Alaçatı / İzmir", area: "1.850 m²", price: "₺3.4M", views: 284, status: "Aktif", tag: "Merkez", lat: 38.281, lng: 26.376 },
  { id: "ARS-0128", loc: "Bodrum / Muğla", area: "3.200 m²", price: "₺2.8M", views: 226, status: "Taslak", tag: "Villa imarlı", lat: 37.034, lng: 27.430 },
  { id: "ARS-0125", loc: "Alaçatı / İzmir", area: "2.450 m²", price: "₺3.8M", views: 198, status: "Aktif", tag: "Merkez", lat: 38.286, lng: 26.371 },
  { id: "ARS-0119", loc: "Marmaris / Muğla", area: "6.300 m²", price: "₺2.6M", views: 174, status: "Pasif", lat: 36.852, lng: 28.275 },
];

const initialCustomers: Customer[] = [
  { id: "CUS-001", name: "Mehmet Kaya", interest: "Deniz manzaralı · Muğla", budget: "₺2-3M", stage: "Teklif", last: "2 saat", segment: "Sıcak" },
  { id: "CUS-002", name: "Ayşe Türk", interest: "Bağ-bahçe · Çanakkale", budget: "₺1-2M", stage: "Görüşme", last: "5 saat", segment: "Sıcak" },
  { id: "CUS-003", name: "Kerem Özbek", interest: "Villa imarlı · İzmir", budget: "₺3-5M", stage: "Kaparo", last: "3 saat", segment: "Sıcak" },
  { id: "CUS-004", name: "Selin Aksoy", interest: "Zeytinlik · Ayvalık", budget: "₺800K-1.2M", stage: "Görüşme", last: "1 gün", segment: "Ilık" },
  { id: "CUS-005", name: "Deniz Bayar", interest: "Marmaris · Villa", budget: "₺2-3M", stage: "Teklif", last: "1 gün", segment: "Sıcak" },
  { id: "CUS-006", name: "Onur Demir", interest: "Bodrum · 1500m²+", budget: "₺2.5-4M", stage: "İlk temas", last: "2 gün", segment: "Ilık" },
  { id: "CUS-007", name: "Ela Şen", interest: "Datça · koy önü", budget: "₺3-4M", stage: "Görüşme", last: "3 gün", segment: "Ilık" },
  { id: "CUS-008", name: "Burak Ay", interest: "Söke · yola cephe", budget: "₺900K-1.2M", stage: "İlk temas", last: "5 gün", segment: "Soğuk" },
];

const initialTransactions: Transaction[] = [
  { id: "TX-2419", customerId: "CUS-003", customer: "Kerem Ö.", listing: "ARS-0125", amount: "₺3.8M", date: "15 Nis", status: "Kaparo" },
  { id: "TX-2418", customerId: "CUS-001", customer: "Mehmet K.", listing: "ARS-0142", amount: "₺1.8M", date: "12 Nis", status: "Teklif" },
  { id: "TX-2416", customerId: "CUS-005", customer: "Deniz B.", listing: "ARS-0119", amount: "₺2.6M", date: "04 Nis", status: "Kaparo" },
  { id: "TX-2412", customerId: "CUS-004", customer: "Selin A.", listing: "ARS-0137", amount: "₺1.2M", date: "28 Mar", status: "Tapu tamam" },
  { id: "TX-2410", customerId: "CUS-006", customer: "Onur D.", listing: "ARS-0134", amount: "₺950K", date: "22 Mar", status: "Tapu tamam" },
];

const initialEvents: CalendarEvent[] = [
  { id: "EV-01", day: "Pzt", time: "10:00", title: "Saha gezisi · Mehmet K.", type: "saha", loc: "ARS-0142" },
  { id: "EV-02", day: "Sal", time: "14:30", title: "Tapu randevusu · Selin A.", type: "tapu", loc: "ARS-0137" },
  { id: "EV-03", day: "Çar", time: "11:00", title: "Görüşme · Kerem Ö.", type: "gorusme" },
  { id: "EV-04", day: "Çar", time: "16:00", title: "Saha gezisi · Onur D.", type: "saha", loc: "ARS-0134" },
  { id: "EV-05", day: "Cum", time: "09:30", title: "Görüşme · Ayşe T.", type: "gorusme" },
  { id: "EV-06", day: "Cum", time: "13:00", title: "Saha gezisi · Deniz B.", type: "saha", loc: "ARS-0139" },
  { id: "EV-07", day: "Cum", time: "17:00", title: "Tapu randevusu · Burak Ay", type: "tapu", loc: "ARS-0125" },
];

const initialConversations: Conversation[] = [
  {
    id: "CONV-01",
    name: "Mehmet Kaya",
    customerId: "CUS-001",
    last: "Yarın gelebilirim, saat 14 uygun mu?",
    time: "12 dk",
    unread: true,
    messages: [
      { id: "M-1", text: "Merhaba, ARS-0142 hala satılık mı?", time: "11:42", mine: false },
      { id: "M-2", text: "Merhaba Mehmet Bey, evet hala aktif. Saha gezisi planlayabiliriz.", time: "11:48", mine: true },
      { id: "M-3", text: "Yarın gelebilirim, saat 14 uygun mu?", time: "12:01", mine: false },
    ],
  },
  {
    id: "CONV-02",
    name: "Ayşe Türk",
    customerId: "CUS-002",
    last: "Teşekkürler, brosürü inceleyeceğim.",
    time: "1 sa",
    unread: false,
    messages: [
      { id: "M-1", text: "Çanakkale'deki bağ-bahçe arsalarını gönderebilir misin?", time: "10:12", mine: false },
      { id: "M-2", text: "Tabii, e-postaya brosürü gönderiyorum.", time: "10:25", mine: true },
      { id: "M-3", text: "Teşekkürler, brosürü inceleyeceğim.", time: "10:40", mine: false },
    ],
  },
  {
    id: "CONV-03",
    name: "Kerem Özbek",
    customerId: "CUS-003",
    last: "AI: Kaparo ödeme detayları gönderildi.",
    time: "2 sa",
    unread: false,
    ai: true,
    messages: [
      { id: "M-1", text: "Kaparo nasıl ödenecek?", time: "09:15", mine: false },
      { id: "M-2", text: "Kaparo ödeme detayları gönderildi (AI tarafından otomatik).", time: "09:18", mine: true },
    ],
  },
  {
    id: "CONV-04",
    name: "Selin Aksoy",
    customerId: "CUS-004",
    last: "Tapu işlemi tamam, görüşmek üzere!",
    time: "5 sa",
    unread: false,
    messages: [
      { id: "M-1", text: "Tapu işlemi tamam, görüşmek üzere!", time: "06:30", mine: false },
    ],
  },
  {
    id: "CONV-05",
    name: "Deniz Bayar",
    customerId: "CUS-005",
    last: "Marmaris'teki villaya da bakabilir miyiz?",
    time: "1 gün",
    unread: true,
    messages: [
      { id: "M-1", text: "Marmaris'teki villaya da bakabilir miyiz?", time: "Dün 17:00", mine: false },
    ],
  },
];

const initialProfile: Profile = {
  name: "Tuna Yıldız",
  role: "Atölye yöneticisi",
  workshop: "Atelier · arsa",
  email: "tuna@atelier.arsa",
  phone: "+90 532 *** ** 47",
  city: "İstanbul",
};

const initialActivity: ActivityEntry[] = [
  { id: "A-1", time: "13:12", text: "Teklif alındı · ARS-0138 · ₺1.6M", tone: "accent" },
  { id: "A-2", time: "12:45", text: "Yeni müşteri eklendi · Selin A.", tone: "muted" },
  { id: "A-3", time: "11:20", text: "Tapu evrakı tamamlandı · ARS-0125", tone: "success" },
  { id: "A-4", time: "10:08", text: "AI eşleştirmesi: 12 müşteri ↔ ARS-0142", tone: "muted" },
  { id: "A-5", time: "09:30", text: "Kaparo işlendi · ARS-0119 · ₺200K", tone: "success" },
];

const STORAGE_KEY = "atelier-store-v3";
const LEGACY_STORAGE_KEY = "atelier-store-v2";

const initialState: StoreState = {
  listings: initialListings,
  customers: initialCustomers,
  transactions: initialTransactions,
  events: initialEvents,
  conversations: initialConversations,
  profile: initialProfile,
  activity: initialActivity,
  assistantSessions: [],
  activeAssistantSessionId: null,
};

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(() => {
    if (typeof window === "undefined") return initialState;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...initialState,
          ...parsed,
          assistantSessions: parsed.assistantSessions ?? [],
          activeAssistantSessionId: parsed.activeAssistantSessionId ?? null,
        };
      }
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        return {
          ...initialState,
          ...parsed,
          assistantSessions: [],
          activeAssistantSessionId: null,
        };
      }
    } catch {
      /* noop */
    }
    return initialState;
  });
  const [activeConversationId, setActiveConversationId] = useState<string>(
    initialConversations[0]?.id ?? "",
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* noop */
    }
  }, [state]);

  const nextId = (prefix: string) =>
    `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

  const pushActivity = (text: string, tone: ActivityEntry["tone"] = "muted") => {
    setState((s) => ({
      ...s,
      activity: [
        {
          id: nextId("A"),
          time: new Date().toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          text,
          tone,
        },
        ...s.activity,
      ].slice(0, 20),
    }));
  };

  const value: StoreContextType = useMemo(() => {
    return {
      ...state,
      activeConversationId,

      addListing: (l) => {
        const id = `ARS-${String(Math.floor(100 + Math.random() * 900))}`;
        setState((s) => ({
          ...s,
          listings: [{ id, views: 0, ...l }, ...s.listings],
        }));
        pushActivity(`Yeni ilan eklendi · ${id}`, "accent");
      },
      updateListing: (id, patch) => {
        setState((s) => ({
          ...s,
          listings: s.listings.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        }));
        pushActivity(`İlan güncellendi · ${id}`);
      },
      deleteListing: (id) => {
        setState((s) => ({
          ...s,
          listings: s.listings.filter((l) => l.id !== id),
        }));
        pushActivity(`İlan silindi · ${id}`, "muted");
      },

      addCustomer: (c) => {
        const id = nextId("CUS");
        setState((s) => ({
          ...s,
          customers: [{ id, last: "şimdi", ...c }, ...s.customers],
        }));
        pushActivity(`Yeni müşteri eklendi · ${c.name}`, "accent");
      },
      updateCustomer: (id, patch) => {
        setState((s) => ({
          ...s,
          customers: s.customers.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        }));
        pushActivity(`Müşteri güncellendi · ${id}`);
      },
      deleteCustomer: (id) => {
        setState((s) => ({
          ...s,
          customers: s.customers.filter((c) => c.id !== id),
        }));
        pushActivity(`Müşteri silindi · ${id}`, "muted");
      },

      addTransaction: (t) => {
        const id = nextId("TX");
        setState((s) => ({
          ...s,
          transactions: [{ id, ...t }, ...s.transactions],
        }));
        pushActivity(`Yeni işlem · ${id} · ${t.amount}`, "accent");
      },
      updateTransaction: (id, patch) => {
        setState((s) => ({
          ...s,
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, ...patch } : t,
          ),
        }));
        pushActivity(`İşlem güncellendi · ${id}`);
      },
      deleteTransaction: (id) => {
        setState((s) => ({
          ...s,
          transactions: s.transactions.filter((t) => t.id !== id),
        }));
      },

      addEvent: (e) => {
        const id = nextId("EV");
        setState((s) => ({ ...s, events: [{ id, ...e }, ...s.events] }));
        pushActivity(`Yeni randevu · ${e.title}`, "accent");
      },
      updateEvent: (id, patch) => {
        setState((s) => ({
          ...s,
          events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        }));
      },
      deleteEvent: (id) => {
        setState((s) => ({
          ...s,
          events: s.events.filter((e) => e.id !== id),
        }));
        pushActivity(`Randevu silindi`, "muted");
      },

      setActiveConversation: (id) => {
        setActiveConversationId(id);
        setState((s) => ({
          ...s,
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, unread: false } : c,
          ),
        }));
      },
      sendMessage: (conversationId, text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const time = new Date().toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        setState((s) => ({
          ...s,
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  last: trimmed,
                  time: "şimdi",
                  unread: false,
                  messages: [
                    ...c.messages,
                    { id: nextId("M"), text: trimmed, time, mine: true },
                  ],
                }
              : c,
          ),
        }));
        pushActivity(`Mesaj gönderildi`, "muted");
      },
      markConversationRead: (conversationId) => {
        setState((s) => ({
          ...s,
          conversations: s.conversations.map((c) =>
            c.id === conversationId ? { ...c, unread: false } : c,
          ),
        }));
      },

      updateProfile: (patch) => {
        setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
        pushActivity(`Profil güncellendi`);
      },

      pushActivity,

      startAssistantSession: () => {
        const id = nextId("AS");
        const now = new Date().toISOString();
        const session: AssistantSession = {
          id,
          title: "Yeni sohbet",
          createdAt: now,
          updatedAt: now,
          messages: [],
        };
        setState((s) => ({
          ...s,
          assistantSessions: [session, ...s.assistantSessions],
          activeAssistantSessionId: id,
        }));
        return id;
      },
      setActiveAssistantSession: (id) => {
        setState((s) => ({ ...s, activeAssistantSessionId: id }));
      },
      appendAssistantMessage: (sessionId, msg) => {
        const id = nextId("M");
        const now = new Date().toISOString();
        setState((s) => ({
          ...s,
          assistantSessions: s.assistantSessions.map((ss) => {
            if (ss.id !== sessionId) return ss;
            const messages = [...ss.messages, { id, createdAt: now, ...msg }];
            let title = ss.title;
            if (ss.title === "Yeni sohbet" && msg.role === "user") {
              title = msg.text.slice(0, 40);
            }
            return { ...ss, messages, updatedAt: now, title };
          }),
        }));
        return id;
      },
      renameAssistantSession: (id, title) => {
        setState((s) => ({
          ...s,
          assistantSessions: s.assistantSessions.map((ss) =>
            ss.id === id ? { ...ss, title } : ss,
          ),
        }));
      },
      deleteAssistantSession: (id) => {
        setState((s) => {
          const remaining = s.assistantSessions.filter((ss) => ss.id !== id);
          const newActive =
            s.activeAssistantSessionId === id
              ? remaining[0]?.id ?? null
              : s.activeAssistantSessionId;
          return {
            ...s,
            assistantSessions: remaining,
            activeAssistantSessionId: newActive,
          };
        });
      },
      clearAssistantSessions: () => {
        setState((s) => ({
          ...s,
          assistantSessions: [],
          activeAssistantSessionId: null,
        }));
      },

      resetStore: () => {
        setState(initialState);
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* noop */
        }
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, activeConversationId]);

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
