import type {
  AssistantBlock,
  AssistantResponse,
  ExtractedParams,
  IntentName,
} from './types';
import type {
  Listing,
  Customer,
  Transaction,
  CalendarEvent,
  Conversation,
} from '@/lib/store';
import { replies } from './replies';

export interface StoreSnapshot {
  listings: Listing[];
  customers: Customer[];
  transactions: Transaction[];
  events: CalendarEvent[];
  conversations: Conversation[];
}

export interface IntentDef {
  name: IntentName;
  keywords: string[];
  handle: (params: ExtractedParams, store: StoreSnapshot) => AssistantResponse;
}

const PRICE_TO_NUMBER = (priceStr: string): number => {
  const m = /([\d.]+)\s*([MK])/i.exec(priceStr);
  if (!m) return 0;
  const v = parseFloat(m[1]);
  return m[2].toUpperCase() === 'M' ? v * 1_000_000 : v * 1000;
};

const AREA_TO_NUMBER = (areaStr: string): number => {
  const m = /([\d.]+)/.exec(areaStr);
  if (!m) return 0;
  return parseFloat(m[1].replace(/\./g, ''));
};

function listingMatches(l: Listing, p: ExtractedParams): boolean {
  if (p.location && !l.loc.toLowerCase().includes(p.location.toLowerCase())) return false;
  if (p.tags && p.tags.length > 0) {
    if (!l.tag || !p.tags.includes(l.tag)) return false;
  }
  if (p.priceRange) {
    const v = PRICE_TO_NUMBER(l.price);
    if (p.priceRange.min && v < p.priceRange.min) return false;
    if (p.priceRange.max && v > p.priceRange.max) return false;
  }
  if (p.areaRange) {
    const a = AREA_TO_NUMBER(l.area);
    if (p.areaRange.min && a < p.areaRange.min) return false;
    if (p.areaRange.max && a > p.areaRange.max) return false;
  }
  return true;
}

function customerMatches(c: Customer, p: ExtractedParams): boolean {
  if (p.segment && c.segment !== p.segment) return false;
  if (p.stage && c.stage !== p.stage) return false;
  if (p.location && !c.interest.toLowerCase().includes(p.location.toLowerCase())) return false;
  if (p.interestKeyword && !c.interest.toLowerCase().includes(p.interestKeyword.toLowerCase())) return false;
  return true;
}

const listingSearch: IntentDef = {
  name: 'listing.search',
  keywords: ['arsa', 'ilan', 'satilik', 'oner', 'bul', 'goster', 'arazi'],
  handle: (p, s) => {
    const matched = s.listings.filter((l) => l.status === 'Aktif' && listingMatches(l, p));
    if (matched.length === 0) {
      return {
        intent: 'listing.search',
        text: replies.empty(),
        blocks: [{ kind: 'suggest', chips: ['Filtreyi gevşet', 'Tüm aktif ilanlar', 'Bu ay eklenenler'] }],
      };
    }
    const top = matched.slice(0, 5);
    const fragments: string[] = [];
    fragments.push(`${matched.length} arsa buldum`);
    if (p.location) fragments.push(`${p.location} bölgesinde`);
    if (p.tags?.length) fragments.push(`'${p.tags.join(', ')}' etiketli`);
    return {
      intent: 'listing.search',
      text: fragments.join(', ') + '.',
      blocks: [
        { kind: 'listings', ids: top.map((l) => l.id) },
        {
          kind: 'suggest',
          chips: ['Bu listedekilere uygun müşteri', 'Daha geniş bütçe', 'Sadece en yakın 3'],
        },
      ],
    };
  },
};

const customerSearch: IntentDef = {
  name: 'customer.search',
  keywords: ['musteri', 'sicak', 'ilik', 'soguk', 'crm', 'kim'],
  handle: (p, s) => {
    const matched = s.customers.filter((c) => customerMatches(c, p));
    if (matched.length === 0) {
      return {
        intent: 'customer.search',
        text: replies.empty(),
        blocks: [{ kind: 'suggest', chips: ['Tüm sıcak müşteriler', 'Teklif aşamasındakiler'] }],
      };
    }
    const top = matched.slice(0, 6);
    return {
      intent: 'customer.search',
      text: `${matched.length} müşteri bulundu.`,
      blocks: [
        { kind: 'customers', ids: top.map((c) => c.id) },
        { kind: 'suggest', chips: ['Bunlar için uygun arsa', 'Sadece kaparo aşaması'] },
      ],
    };
  },
};

const transactionSummary: IntentDef = {
  name: 'transaction.summary',
  keywords: ['ciro', 'kaparo', 'tapu', 'satis', 'odeme', 'islem', 'gelir'],
  handle: (p, s) => {
    let filtered = s.transactions;
    if (p.stage === 'Kaparo') filtered = filtered.filter((t) => t.status === 'Kaparo');
    else if (p.stage === 'Tapu') filtered = filtered.filter((t) => t.status === 'Tapu tamam');
    else if (p.stage === 'Teklif') filtered = filtered.filter((t) => t.status === 'Teklif');

    const total = filtered.reduce((sum, t) => sum + PRICE_TO_NUMBER(t.amount), 0);
    const fmtTotal =
      total >= 1_000_000
        ? `₺${(total / 1_000_000).toFixed(1)}M`
        : `₺${(total / 1000).toFixed(0)}K`;

    if (filtered.length === 0) {
      return {
        intent: 'transaction.summary',
        text: replies.empty(),
        blocks: [],
      };
    }

    const chartData = filtered.map((t) => ({
      label: t.date,
      value: Math.round(PRICE_TO_NUMBER(t.amount) / 1000),
    }));

    const blocks: AssistantBlock[] = [
      { kind: 'stat', label: 'İşlem sayısı', value: String(filtered.length) },
      { kind: 'stat', label: 'Toplam tutar', value: fmtTotal },
      { kind: 'transactions', ids: filtered.slice(0, 5).map((t) => t.id) },
      { kind: 'chart', chart: 'mini', data: chartData, caption: 'İşlem tutarları (₺K)' },
    ];

    return {
      intent: 'transaction.summary',
      text: `${filtered.length} işlem, toplam ${fmtTotal}.`,
      blocks,
    };
  },
};

const eventList: IntentDef = {
  name: 'event.list',
  keywords: ['randevu', 'takvim', 'haftalik', 'gun', 'plan', 'gezi'],
  handle: (p, s) => {
    let filtered = s.events;
    if (p.day) filtered = filtered.filter((e) => e.day === p.day);
    if (p.eventType) filtered = filtered.filter((e) => e.type === p.eventType);

    if (filtered.length === 0) {
      return {
        intent: 'event.list',
        text: replies.empty(),
        blocks: [],
      };
    }

    return {
      intent: 'event.list',
      text: p.day
        ? `${p.day} günü ${filtered.length} randevu var.`
        : `${filtered.length} randevu listeliyorum.`,
      blocks: [
        { kind: 'events', ids: filtered.map((e) => e.id) },
        { kind: 'suggest', chips: ['Sadece tapu randevuları', 'Sadece saha gezileri'] },
      ],
    };
  },
};

const matchFind: IntentDef = {
  name: 'match.find',
  keywords: ['uygun', 'eslestir', 'eslesen', 'ilgilenir', 'pazara'],
  handle: (p, s) => {
    const lid = p.ids?.listings[0];
    const cid = p.ids?.customers[0];

    if (lid) {
      const listing = s.listings.find((l) => l.id === lid);
      if (!listing) {
        return { intent: 'match.find', text: `${lid} bulunamadı.`, blocks: [] };
      }
      const candidates = s.customers.filter((c) => {
        const interestLower = c.interest.toLowerCase();
        const locLower = listing.loc.toLowerCase();
        const tagLower = (listing.tag ?? '').toLowerCase();
        return (
          locLower.split(/[\/ ]/).some((w) => w.length > 2 && interestLower.includes(w)) ||
          (tagLower && interestLower.includes(tagLower))
        );
      });
      if (candidates.length === 0) {
        return { intent: 'match.find', text: `${listing.id} için eşleşen müşteri yok.`, blocks: [] };
      }
      return {
        intent: 'match.find',
        text: `${listing.id} (${listing.loc}) için ${candidates.length} uygun müşteri.`,
        blocks: [{ kind: 'customers', ids: candidates.slice(0, 5).map((c) => c.id) }],
      };
    }

    if (cid) {
      const cust = s.customers.find((c) => c.id === cid);
      if (!cust) {
        return { intent: 'match.find', text: `${cid} bulunamadı.`, blocks: [] };
      }
      const interestLower = cust.interest.toLowerCase();
      const candidates = s.listings.filter(
        (l) =>
          l.status === 'Aktif' &&
          (interestLower.includes(l.loc.split('/')[0].trim().toLowerCase()) ||
            (l.tag && interestLower.includes(l.tag.toLowerCase()))),
      );
      if (candidates.length === 0) {
        return { intent: 'match.find', text: `${cust.name} için eşleşen ilan yok.`, blocks: [] };
      }
      return {
        intent: 'match.find',
        text: `${cust.name} için ${candidates.length} uygun arsa.`,
        blocks: [{ kind: 'listings', ids: candidates.slice(0, 5).map((l) => l.id) }],
      };
    }

    return {
      intent: 'match.find',
      text: 'Hangi ilan veya müşteri için eşleştireyim? (örn. ARS-0142 veya Mehmet)',
      blocks: [],
    };
  },
};

const countStats: IntentDef = {
  name: 'count.stats',
  keywords: ['kac', 'sayi', 'toplam', 'okunmamis', 'aktif', 'bekleyen'],
  handle: (_p, s) => {
    const blocks: AssistantBlock[] = [];
    blocks.push({
      kind: 'stat',
      label: 'Aktif ilan',
      value: String(s.listings.filter((l) => l.status === 'Aktif').length),
    });
    blocks.push({
      kind: 'stat',
      label: 'Sıcak müşteri',
      value: String(s.customers.filter((c) => c.segment === 'Sıcak').length),
    });
    blocks.push({
      kind: 'stat',
      label: 'Okunmamış mesaj',
      value: String(s.conversations.filter((c) => c.unread).length),
    });
    blocks.push({
      kind: 'stat',
      label: 'Bekleyen evrak',
      value: String(s.transactions.filter((t) => t.status === 'Kaparo' || t.status === 'Teklif').length),
    });
    return {
      intent: 'count.stats',
      text: 'Atölye anlık görüntüsü:',
      blocks,
    };
  },
};

const greeting: IntentDef = {
  name: 'greeting',
  keywords: ['selam', 'merhaba', 'hey', 'hi', 'yardim', 'yapabilirsin', 'naber'],
  handle: () => {
    const r = replies.greeting();
    return {
      intent: 'greeting',
      text: r.text,
      blocks: [{ kind: 'suggest', chips: r.chips }],
    };
  },
};

const unknown: IntentDef = {
  name: 'unknown',
  keywords: [],
  handle: () => {
    const r = replies.unknown();
    return {
      intent: 'unknown',
      text: r.text,
      blocks: [{ kind: 'suggest', chips: r.chips }],
    };
  },
};

export const INTENTS: readonly IntentDef[] = [
  matchFind,
  transactionSummary,
  eventList,
  listingSearch,
  customerSearch,
  countStats,
  greeting,
  unknown,
] as const;
