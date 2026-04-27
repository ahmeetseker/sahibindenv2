import { describe, it, expect } from 'vitest';
import { normalize } from '../normalize';

describe('normalize', () => {
  it('lowercases and removes diacritics', () => {
    expect(normalize('ÇANAKKALE')).toBe('canakkale');
    expect(normalize('İzmir')).toBe('izmir');
    expect(normalize('Şehir')).toBe('sehir');
    expect(normalize('Görüşme')).toBe('gorusme');
  });

  it('collapses whitespace and trims', () => {
    expect(normalize('  iki   kelime  ')).toBe('iki kelime');
  });

  it('expands common money/area shortcuts', () => {
    expect(normalize('2M altı')).toContain('2000000');
    expect(normalize('800K')).toContain('800000');
    expect(normalize('5 dönüm')).toContain('5000 m');
  });

  it('preserves digits and punctuation that matter', () => {
    expect(normalize('ARS-0142 hakkında')).toContain('ars-0142');
  });
});
