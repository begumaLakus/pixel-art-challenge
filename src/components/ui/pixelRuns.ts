export interface PixelRun {
  color: string;
  /** Bu parçanın satır içindeki başlangıç sütunu. */
  start: number;
  /** Aynı renkte art arda kaç hücre olduğu. */
  length: number;
}

/**
 * Bir piksel satırını aynı renkli ardışık hücre gruplarına böler. Çizimlerin
 * çoğu geniş düz alanlar içerdiği için 32x32'lik bir çizim bin View yerine
 * birkaç düzine View ile çizilebilir.
 */
export const buildRuns = (row: readonly string[]): PixelRun[] => {
  const runs: PixelRun[] = [];

  row.forEach((color, column) => {
    const last = runs[runs.length - 1];

    if (last && last.color === color) {
      last.length += 1;
      return;
    }

    runs.push({ color, start: column, length: 1 });
  });

  return runs;
};

/**
 * Piksel dizisini `resolution` genişlikli satırlara böler. Dizi eksik veya
 * fazla gelirse eksik hücreler `fallback` ile doldurulur, fazlası atılır;
 * bozuk bir kayıt çizimi çökertmez.
 */
export const toRows = (
  pixels: readonly string[],
  resolution: number,
  fallback: string,
): string[][] =>
  Array.from({ length: resolution }, (_, row) =>
    Array.from(
      { length: resolution },
      (_, column) => pixels[row * resolution + column] ?? fallback,
    ),
  );
