const GREETINGS = [
  'Merhaba! Sana arsa, müşteri, finans ve takvim konusunda yardımcı olabilirim.',
  'Merhaba. Sorunu yaz; veriden bakarım.',
];

const GREETING_CHIPS = [
  'Çanakkale deniz manzaralı arsa öner',
  'Bu hafta randevular',
  'Sıcak müşterilerim',
  'Bu ayki kaparolar',
];

const UNKNOWN_PREFIX = [
  'Tam olarak çıkaramadım, şunlar arasında bir tane mi olmalı?',
  'Soruyu net çözemedim. Aşağıdakilerden birini deneyebilirsin:',
];

const UNKNOWN_CHIPS = [
  'Aktif ilanlar',
  'Bu ay tapu tamamlananlar',
  'Ayvalık zeytinlik ₺1M altı',
  'Mehmet için uygun arsa',
];

const EMPTY_RESULT = [
  'Bu kriterlere uyan kayıt bulamadım.',
  'Eşleşme yok. Filtreyi gevşetebilirim.',
];

export function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export const replies = {
  greeting: () => ({ text: pick(GREETINGS), chips: GREETING_CHIPS }),
  unknown: () => ({ text: pick(UNKNOWN_PREFIX), chips: UNKNOWN_CHIPS }),
  empty: () => pick(EMPTY_RESULT),
};
