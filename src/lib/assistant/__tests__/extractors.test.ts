import { describe, it, expect } from 'vitest';
import {
  extractLocation,
  extractPriceRange,
  extractAreaRange,
  extractTags,
  extractSegment,
  extractStage,
  extractDay,
  extractEventType,
  extractIds,
} from '../extractors';
import { normalize } from '../normalize';

const n = (s: string) => normalize(s);

describe('extractLocation', () => {
  it('detects Çanakkale', () => {
    expect(extractLocation(n("Çanakkale'de arsa öner"))).toBe('Çanakkale');
  });
  it('detects Ayvalık', () => {
    expect(extractLocation(n('Ayvalık zeytinlik'))).toBe('Ayvalık');
  });
  it('returns undefined when no location', () => {
    expect(extractLocation(n('arsa öner'))).toBeUndefined();
  });
});

describe('extractPriceRange', () => {
  it('parses "2M altı" as max', () => {
    expect(extractPriceRange(n('2M altı'))).toEqual({ max: 2_000_000 });
  });
  it('parses "1M üstü" as min', () => {
    expect(extractPriceRange(n('1M üstü'))).toEqual({ min: 1_000_000 });
  });
  it('parses "1-2M arası"', () => {
    expect(extractPriceRange(n('1-2M arası'))).toEqual({ min: 1_000_000, max: 2_000_000 });
  });
  it('returns undefined when no price', () => {
    expect(extractPriceRange(n('arsa'))).toBeUndefined();
  });
});

describe('extractAreaRange', () => {
  it('parses "2.000 m² üstü"', () => {
    expect(extractAreaRange(n('2.000 m² üstü'))).toEqual({ min: 2000 });
  });
  it('parses "5 dönüm" as 5000 m²', () => {
    expect(extractAreaRange(n('5 dönüm'))).toBeDefined();
  });
});

describe('extractTags', () => {
  it('detects deniz manzaralı', () => {
    expect(extractTags(n('deniz manzaralı arsa'))).toContain('Deniz manzaralı');
  });
  it('detects zeytinlik', () => {
    expect(extractTags(n('Ayvalık zeytinlik'))).toContain('Zeytinlik');
  });
  it('detects synonym "villa imarı" → "Villa imarlı"', () => {
    expect(extractTags(n('villa imarı'))).toContain('Villa imarlı');
  });
});

describe('extractSegment', () => {
  it('detects sıcak', () => {
    expect(extractSegment(n('sıcak müşterilerim'))).toBe('Sıcak');
  });
});

describe('extractStage', () => {
  it('detects kaparo', () => {
    expect(extractStage(n('kaparo aşamasındakiler'))).toBe('Kaparo');
  });
});

describe('extractDay', () => {
  it('detects Cuma', () => {
    expect(extractDay(n('Cuma ne var'))).toBe('Cum');
  });
  it('detects bugün as today day code', () => {
    expect(extractDay(n('bugün ne var'))).toBeDefined();
  });
});

describe('extractEventType', () => {
  it('detects tapu', () => {
    expect(extractEventType(n('tapu randevuları'))).toBe('tapu');
  });
});

describe('extractIds', () => {
  it('detects listing id', () => {
    expect(extractIds(n('ARS-0142 için')).listings).toContain('ARS-0142');
  });
  it('detects customer id', () => {
    expect(extractIds(n('CUS-001 ile')).customers).toContain('CUS-001');
  });
});
