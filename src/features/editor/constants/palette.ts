/**
 * Challenge kendi paletini tanımlamadığında kullanılan 16 renkli varsayılan
 * palet (PICO-8 paleti, pixel art için dengeli ve yaygın bir seçim). İlk
 * renk uygulamanın mürekkep siyahıyla aynıdır.
 */
export const DEFAULT_PALETTE: readonly string[] = [
  '#151515',
  '#1D2B53',
  '#7E2553',
  '#008751',
  '#AB5236',
  '#5F574F',
  '#C2C3C7',
  '#FFF1E8',
  '#FF004D',
  '#FFA300',
  '#FFEC27',
  '#00E436',
  '#29ADFF',
  '#83769C',
  '#FF77A8',
  '#FFCCAA',
];

/**
 * Challenge'ın paleti geçerli bir renk listesiyse onu, değilse varsayılanı
 * döner. Sunucudan gelen veri bozuk olsa bile editör boş palette kalmaz.
 */
export const resolvePalette = (
  palette: readonly string[] | null | undefined,
): readonly string[] => {
  const valid = (palette ?? []).filter((color) =>
    /^#[0-9A-Fa-f]{6}$/.test(color),
  );

  return valid.length >= 2 ? valid : DEFAULT_PALETTE;
};
