/**
 * "AI jüri": bir çizim için kısa, samimi bir yorum üretmek üzere Gemini'ye
 * gönderilecek metni hazırlayan ve dönen yorumu doğrulayan saf fonksiyonlar.
 * Görüntü yerine, çizimin harflerle kodlanmış bir metin ızgarası gönderilir;
 * böylece ek bir görüntü işleme servisi gerekmez.
 */

/** İstemcideki editör zemin rengiyle aynı olmalı (usePixelEditor.BACKGROUND_COLOR). */
export const CANVAS_BACKGROUND = '#FDFBF7';

/** Çizimin "boş" sayılması için gereken en az dolu hücre sayısı. */
export const MIN_FILLED_CELLS = 4;

export const MAX_COMMENT_LENGTH = 160;

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export interface PixelDescription {
  /** Satır satır ızgara; "." boş zemin, harfler renkler. */
  grid: string;
  /** "A=#FF004D, B=#151515" biçiminde renk açıklaması. */
  legend: string;
  /** Zeminden farklı hücre sayısı. */
  filled: number;
}

export const describePixels = (
  pixels: readonly string[],
  resolution: number,
): PixelDescription => {
  const counts = new Map<string, number>();

  for (const color of pixels) {
    if (color !== CANVAS_BACKGROUND) {
      counts.set(color, (counts.get(color) ?? 0) + 1);
    }
  }

  // En sık kullanılan renk "A" olur; 26'dan fazla renk varsa gerisi "#".
  const ranked = Array.from(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, LETTERS.length)
    .map(([color], index) => [color, LETTERS[index]] as const);

  const letterOf = new Map(ranked);
  const rows: string[] = [];

  for (let row = 0; row < resolution; row += 1) {
    let line = '';

    for (let column = 0; column < resolution; column += 1) {
      const color = pixels[row * resolution + column] ?? CANVAS_BACKGROUND;

      line += color === CANVAS_BACKGROUND ? '.' : (letterOf.get(color) ?? '#');
    }

    rows.push(line);
  }

  return {
    grid: rows.join('\n'),
    legend: ranked.map(([color, letter]) => `${letter}=${color}`).join(', '),
    filled: Array.from(counts.values()).reduce((sum, count) => sum + count, 0),
  };
};

export const buildJuryPrompt = (input: {
  themeTitle: string;
  themeDescription: string;
  resolution: number;
  description: PixelDescription;
}): string => `Sen "Pixel Art Challenge" yarışmasının cana yakın bir jüri üyesisin.
Tema: "${input.themeTitle}" — ${input.themeDescription}

Aşağıda bir katılımcının ${input.resolution}x${input.resolution} pixel art çizimi var.
"." boş zemini, harfler renkleri gösterir.
Renkler: ${input.description.legend}

${input.description.grid}

Çizimi yorumla:
- Türkçe, samimi ve yapıcı ol; en fazla ${MAX_COMMENT_LENGTH} karakter, 1-2 cümle.
- Çizimde ne gördüğünü söyle (ne çizildiğini tahmin et) ve küçük, uygulanabilir bir ipucu ver.
- Asla aşağılama, alay etme veya olumsuz kişisel yorum yapma.
- En fazla 1 emoji kullanabilirsin.

Sadece istenen JSON şemasına uygun bir yorum üret.`;

/** Gemini'den dönen yorumu temizler; kullanılamazsa null döner. */
export const normalizeJuryComment = (value: unknown): string | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const comment = (value as Record<string, unknown>).comment;

  if (typeof comment !== 'string') {
    return null;
  }

  const trimmed = comment.replace(/\s+/g, ' ').trim();

  if (trimmed.length === 0 || trimmed.length > MAX_COMMENT_LENGTH) {
    return null;
  }

  return trimmed;
};
