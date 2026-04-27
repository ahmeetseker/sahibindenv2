const TR_MAP: Record<string, string> = {
  'ç': 'c', 'Ç': 'c',
  'ğ': 'g', 'Ğ': 'g',
  'ı': 'i', 'I': 'i', 'İ': 'i',
  'ö': 'o', 'Ö': 'o',
  'ş': 's', 'Ş': 's',
  'ü': 'u', 'Ü': 'u',
};

function stripDiacritics(s: string): string {
  return s
    .split('')
    .map((c) => TR_MAP[c] ?? c)
    .join('')
    .toLowerCase();
}

function expandShortcuts(s: string): string {
  let out = s;

  // 1. Türk binler ayracı (3 haneli grup) kaldır: "2.000" → "2000", "1.500.000" → "1500000"
  while (/(\d{1,3})\.(\d{3})(?!\d)/.test(out)) {
    out = out.replace(/(\d{1,3})\.(\d{3})(?!\d)/g, '$1$2');
  }
  // 2. Ondalık virgülü noktaya çevir: "1,5M" → "1.5M"
  out = out.replace(/(\d),(\d)/g, '$1.$2');

  // 3. Alan birimini (m²) korumak için tokenize et — M (milyon) genişlemesinden ayrı tut
  out = out.replace(/m\s*²/gi, '__M2__');
  out = out.replace(/m²/gi, '__M2__');
  out = out.replace(/\bm\s*kare\b/gi, '__M2__');

  // 4. Range pattern'ları (önce, single'dan önce): "1-2M" → "1000000-2000000"
  out = out.replace(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*m\b/gi, (_m, a: string, b: string) => {
    return `${Math.round(parseFloat(a) * 1_000_000)}-${Math.round(parseFloat(b) * 1_000_000)}`;
  });
  out = out.replace(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*k\b/gi, (_m, a: string, b: string) => {
    return `${Math.round(parseFloat(a) * 1_000)}-${Math.round(parseFloat(b) * 1_000)}`;
  });

  // 5. Single number M/K (m²'yi tokenize ettiğimizden dolayı serbest m sadece milyon kalır)
  out = out.replace(/(\d+(?:\.\d+)?)\s*m\b/gi, (_m, num: string) => {
    return String(Math.round(parseFloat(num) * 1_000_000));
  });
  out = out.replace(/(\d+(?:\.\d+)?)\s*k\b/gi, (_m, num: string) => {
    return String(Math.round(parseFloat(num) * 1_000));
  });

  // 6. Word forms
  out = out.replace(/(\d+(?:\.\d+)?)\s*milyon\b/gi, (_m, num: string) => {
    return String(Math.round(parseFloat(num) * 1_000_000));
  });
  out = out.replace(/(\d+(?:\.\d+)?)\s*bin\b/gi, (_m, num: string) => {
    return String(Math.round(parseFloat(num) * 1_000));
  });

  // 7. Dönüm → m²
  out = out.replace(/(\d+(?:\.\d+)?)\s*donum\b/gi, (_m, num: string) => {
    return `${Math.round(parseFloat(num) * 1000)} __M2__`;
  });

  // 8. Tokeni tekrar 'm' olarak yaz (alan ölçüsü, sade form)
  out = out.replace(/__M2__/g, 'm');

  return out;
}

export function normalize(input: string): string {
  const stripped = stripDiacritics(input);
  const expanded = expandShortcuts(stripped);
  return expanded.replace(/\s+/g, ' ').trim();
}
