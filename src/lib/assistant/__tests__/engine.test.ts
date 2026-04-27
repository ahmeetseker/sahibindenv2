import { describe, it, expect } from 'vitest';
import { classify } from '../engine';
import type { StoreSnapshot } from '../intents';
import type {
  Listing,
  Customer,
  Transaction,
  CalendarEvent,
  Conversation,
} from '@/lib/store';

const sampleStore: StoreSnapshot = {
  listings: [
    { id: 'ARS-0142', loc: 'Ayvacık / Çanakkale', area: '8.250 m²', price: '₺1.8M', views: 0, status: 'Aktif', tag: 'Deniz manzaralı' },
    { id: 'ARS-0137', loc: 'Cunda / Balıkesir', area: '5.600 m²', price: '₺1.2M', views: 0, status: 'Aktif', tag: 'Zeytinlik' },
  ] satisfies Listing[],
  customers: [
    { id: 'CUS-001', name: 'Mehmet Kaya', interest: 'Deniz manzaralı · Muğla', budget: '₺2-3M', stage: 'Teklif', last: '2 saat', segment: 'Sıcak' },
    { id: 'CUS-004', name: 'Selin Aksoy', interest: 'Zeytinlik · Ayvalık', budget: '₺800K-1.2M', stage: 'Görüşme', last: '1 gün', segment: 'Ilık' },
  ] satisfies Customer[],
  transactions: [
    { id: 'TX-2419', customerId: 'CUS-003', customer: 'Kerem Ö.', listing: 'ARS-0125', amount: '₺3.8M', date: '15 Nis', status: 'Kaparo' },
    { id: 'TX-2412', customerId: 'CUS-004', customer: 'Selin A.', listing: 'ARS-0137', amount: '₺1.2M', date: '28 Mar', status: 'Tapu tamam' },
  ] satisfies Transaction[],
  events: [
    { id: 'EV-05', day: 'Cum', time: '09:30', title: 'Görüşme · Ayşe T.', type: 'gorusme' },
    { id: 'EV-07', day: 'Cum', time: '17:00', title: 'Tapu randevusu · Burak Ay', type: 'tapu' },
  ] satisfies CalendarEvent[],
  conversations: [] satisfies Conversation[],
};

describe('engine.classify', () => {
  it('routes location+tag to listing.search', () => {
    const r = classify('Çanakkale deniz manzaralı arsa öner', sampleStore);
    expect(r.intent).toBe('listing.search');
    expect(r.blocks.some((b) => b.kind === 'listings')).toBe(true);
  });

  it('routes "sıcak müşterilerim" to customer.search', () => {
    const r = classify('sıcak müşterilerim', sampleStore);
    expect(r.intent).toBe('customer.search');
  });

  it('routes "bu ayki kaparolar" to transaction.summary', () => {
    const r = classify('bu ayki kaparolar', sampleStore);
    expect(r.intent).toBe('transaction.summary');
    expect(r.blocks.some((b) => b.kind === 'stat')).toBe(true);
  });

  it('routes "Cuma ne var" to event.list', () => {
    const r = classify('Cuma ne var', sampleStore);
    expect(r.intent).toBe('event.list');
  });

  it('routes "ARS-0142 için uygun müşteri" to match.find', () => {
    const r = classify('ARS-0142 için uygun müşteri', sampleStore);
    expect(r.intent).toBe('match.find');
  });

  it('routes "merhaba" to greeting', () => {
    const r = classify('merhaba', sampleStore);
    expect(r.intent).toBe('greeting');
  });

  it('routes garbage to unknown', () => {
    const r = classify('asdfgh xyzqq', sampleStore);
    expect(r.intent).toBe('unknown');
  });

  it('always returns text and blocks array', () => {
    const r = classify('Ayvalık zeytinlik', sampleStore);
    expect(typeof r.text).toBe('string');
    expect(Array.isArray(r.blocks)).toBe(true);
  });
});
