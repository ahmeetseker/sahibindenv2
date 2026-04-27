import type { ExtractedParams, PriceRange, AreaRange } from './types';

const LOCATIONS: Array<{ key: string; canonical: string }> = [
  { key: 'canakkale', canonical: 'Çanakkale' },
  { key: 'ayvalik', canonical: 'Ayvalık' },
  { key: 'datca', canonical: 'Datça' },
  { key: 'bodrum', canonical: 'Bodrum' },
  { key: 'alacati', canonical: 'Alaçatı' },
  { key: 'marmaris', canonical: 'Marmaris' },
  { key: 'soke', canonical: 'Söke' },
  { key: 'ayvacik', canonical: 'Ayvacık' },
  { key: 'cunda', canonical: 'Cunda' },
  { key: 'mugla', canonical: 'Muğla' },
  { key: 'izmir', canonical: 'İzmir' },
  { key: 'aydin', canonical: 'Aydın' },
  { key: 'balikesir', canonical: 'Balıkesir' },
];

export function extractLocation(text: string): string | undefined {
  for (const loc of LOCATIONS) {
    if (text.includes(loc.key)) return loc.canonical;
  }
  return undefined;
}

const NUM_RE = '(\\d+(?:[.,]\\d+)?|\\d{1,3}(?:[.,]\\d{3})+)';

function parseNum(raw: string): number {
  const cleaned = raw.replace(/\./g, '').replace(/,/g, '');
  return parseInt(cleaned, 10);
}

export function extractPriceRange(text: string): PriceRange | undefined {
  const range = new RegExp(`${NUM_RE}\\s*-\\s*${NUM_RE}\\s*(?:arasi|arası)?`).exec(text);
  if (range) {
    const a = parseNum(range[1]);
    const b = parseNum(range[2]);
    if (a >= 100_000 && b >= 100_000) {
      return { min: Math.min(a, b), max: Math.max(a, b) };
    }
  }
  const max = new RegExp(`${NUM_RE}\\s*(?:alti|altinda)`).exec(text);
  if (max) {
    const v = parseNum(max[1]);
    if (v >= 100_000) return { max: v };
  }
  const min = new RegExp(`${NUM_RE}\\s*(?:ustu|ustunde)`).exec(text);
  if (min) {
    const v = parseNum(min[1]);
    if (v >= 100_000) return { min: v };
  }
  return undefined;
}

export function extractAreaRange(text: string): AreaRange | undefined {
  const range = new RegExp(`${NUM_RE}\\s*-\\s*${NUM_RE}\\s*m`).exec(text);
  if (range) {
    return {
      min: Math.min(parseNum(range[1]), parseNum(range[2])),
      max: Math.max(parseNum(range[1]), parseNum(range[2])),
    };
  }
  const min = new RegExp(`${NUM_RE}\\s*m[^a-z]?\\s*(?:ustu|ustunde)`).exec(text);
  if (min) return { min: parseNum(min[1]) };
  const max = new RegExp(`${NUM_RE}\\s*m[^a-z]?\\s*(?:alti|altinda)`).exec(text);
  if (max) return { max: parseNum(max[1]) };
  const bare = new RegExp(`${NUM_RE}\\s*m\\b`).exec(text);
  if (bare) {
    const v = parseNum(bare[1]);
    if (v >= 100) return { min: Math.floor(v * 0.8), max: Math.ceil(v * 1.2) };
  }
  return undefined;
}

const TAGS: Array<{ patterns: string[]; canonical: string }> = [
  { patterns: ['deniz manzarali', 'deniz manzarasi', 'deniz manzara'], canonical: 'Deniz manzaralı' },
  { patterns: ['koy onu', 'koyonu'], canonical: 'Koy önü' },
  { patterns: ['zeytinlik', 'zeytin bahcesi'], canonical: 'Zeytinlik' },
  { patterns: ['yola cephe', 'yol cephe'], canonical: 'Yola cephe' },
  { patterns: ['merkez', 'merkezde'], canonical: 'Merkez' },
  { patterns: ['villa imarli', 'villa imari'], canonical: 'Villa imarlı' },
];

export function extractTags(text: string): string[] {
  const out: string[] = [];
  for (const tag of TAGS) {
    if (tag.patterns.some((p) => text.includes(p))) {
      if (!out.includes(tag.canonical)) out.push(tag.canonical);
    }
  }
  return out;
}

export function extractSegment(text: string): ExtractedParams['segment'] {
  if (/\bsicak\b/.test(text)) return 'Sıcak';
  if (/\bilik\b/.test(text)) return 'Ilık';
  if (/\bsoguk\b/.test(text)) return 'Soğuk';
  return undefined;
}

export function extractStage(text: string): ExtractedParams['stage'] {
  if (/\bilk temas\b/.test(text)) return 'İlk temas';
  if (/\bgorusme\b/.test(text)) return 'Görüşme';
  if (/\bteklif\b/.test(text)) return 'Teklif';
  if (/\bkaparo\b/.test(text)) return 'Kaparo';
  if (/\btapu\b/.test(text)) return 'Tapu';
  return undefined;
}

const DAY_MAP: Record<string, NonNullable<ExtractedParams['day']>> = {
  'pazartesi': 'Pzt', 'pzt': 'Pzt',
  'sali': 'Sal', 'sal': 'Sal',
  'carsamba': 'Çar', 'car': 'Çar',
  'persembe': 'Per', 'per': 'Per',
  'cuma': 'Cum', 'cum': 'Cum',
  'cumartesi': 'Cmt', 'cmt': 'Cmt',
  'pazar': 'Paz', 'paz': 'Paz',
};

function weekdayCode(jsDay: number): NonNullable<ExtractedParams['day']> {
  const map: Array<NonNullable<ExtractedParams['day']>> = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  return map[jsDay];
}

export function extractDay(text: string): ExtractedParams['day'] {
  if (/\bbugun\b/.test(text)) return weekdayCode(new Date().getDay());
  if (/\byarin\b/.test(text)) return weekdayCode((new Date().getDay() + 1) % 7);
  for (const key of Object.keys(DAY_MAP)) {
    const re = new RegExp(`\\b${key}\\b`);
    if (re.test(text)) return DAY_MAP[key];
  }
  return undefined;
}

export function extractEventType(text: string): ExtractedParams['eventType'] {
  if (/\btapu\b/.test(text)) return 'tapu';
  if (/\bsaha\b/.test(text)) return 'saha';
  if (/\bgorusme\b/.test(text)) return 'gorusme';
  return undefined;
}

export function extractIds(text: string): NonNullable<ExtractedParams['ids']> {
  const listings = Array.from(text.matchAll(/\bars-(\d{3,4})\b/gi)).map((m) => `ARS-${m[1]}`.toUpperCase());
  const customers = Array.from(text.matchAll(/\bcus-(\d{3,4})\b/gi)).map((m) => `CUS-${m[1]}`.toUpperCase());
  const transactions = Array.from(text.matchAll(/\btx-(\d{3,4})\b/gi)).map((m) => `TX-${m[1]}`.toUpperCase());
  return { listings, customers, transactions };
}
