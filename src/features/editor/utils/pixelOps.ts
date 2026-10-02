/**
 * Editörün saf (React'siz) piksel işlemleri. Hepsi girdi dizisini mutate
 * etmez; değişiklik yoksa aynı referansı geri döndürür.
 */

/**
 * Seçili indekslere, soldan sağa ayna simetrisindeki karşılıklarını ekler.
 * Sonuç tekrarsızdır ve aralık dışı indeksler atılır.
 */
export const withMirror = (
  indices: readonly number[],
  resolution: number,
  enabled: boolean,
): number[] => {
  const total = resolution * resolution;
  const result = new Set<number>();

  for (const index of indices) {
    if (index < 0 || index >= total) {
      continue;
    }

    result.add(index);

    if (enabled) {
      const row = Math.floor(index / resolution);
      const column = index % resolution;

      result.add(row * resolution + (resolution - 1 - column));
    }
  }

  return Array.from(result);
};

/**
 * Başlangıç hücresiyle aynı renkte ve dört yönde bağlantılı tüm hücreleri
 * `color` ile doldurur (kova aracı). Başlangıç zaten o renkteyse ya da
 * aralık dışıysa dokunmaz.
 */
export const floodFill = (
  pixels: readonly string[],
  resolution: number,
  startIndex: number,
  color: string,
): { next: string[]; changed: boolean } => {
  if (startIndex < 0 || startIndex >= pixels.length) {
    return { next: pixels as string[], changed: false };
  }

  const target = pixels[startIndex];

  if (target === color) {
    return { next: pixels as string[], changed: false };
  }

  const next = pixels.slice();
  const stack = [startIndex];

  while (stack.length > 0) {
    const index = stack.pop() as number;

    if (next[index] !== target) {
      continue;
    }

    next[index] = color;

    const row = Math.floor(index / resolution);
    const column = index % resolution;

    if (column > 0) stack.push(index - 1);
    if (column < resolution - 1) stack.push(index + 1);
    if (row > 0) stack.push(index - resolution);
    if (row < resolution - 1) stack.push(index + resolution);
  }

  return { next, changed: true };
};
