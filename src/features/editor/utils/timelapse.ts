/**
 * Time-lapse: bir çizimin adım adım nasıl oluştuğunu kaydeden ve yeniden
 * oynatan saf fonksiyonlar.
 *
 * Bir "adım", kullanıcının tek bir hamlesinin (bir fırça darbesi, bir kova
 * doldurması, bir temizleme) piksel değişimidir ve renge göre gruplanmış
 * indekslerden oluşur. Kayıt önceki ve sonraki tuvalin farkından üretildiği
 * için kalem, kova ve simetri gibi araçların hepsi aynı biçimde saklanır.
 *
 * Kodlanmış biçim (Firestore'da tek bir string):
 *   adımlar "/" ile, adım içindeki gruplar ";" ile ayrılır;
 *   grup = "<hex6>:<indeks>.<indeks>..."   (renk "#" olmadan)
 */
export interface StepGroup {
  color: string;
  indices: number[];
}

export type Step = StepGroup[];

/** Firestore kuralındaki üst sınırla aynı olmalı (bkz. firestore.rules). */
export const MAX_ENCODED_LENGTH = 60000;

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

/** İki tuval arasındaki farkı, yeni renge göre gruplanmış bir adıma çevirir. */
export const diffToStep = (
  previous: readonly string[],
  next: readonly string[],
): Step => {
  const groups = new Map<string, number[]>();

  next.forEach((color, index) => {
    if (previous[index] !== color) {
      const bucket = groups.get(color);

      if (bucket) {
        bucket.push(index);
      } else {
        groups.set(color, [index]);
      }
    }
  });

  return Array.from(groups, ([color, indices]) => ({ color, indices }));
};

export const encodeSteps = (steps: readonly Step[]): string =>
  steps
    .filter((step) => step.length > 0)
    .map((step) =>
      step
        .map((group) => `${group.color.slice(1)}:${group.indices.join('.')}`)
        .join(';'),
    )
    .join('/');

/**
 * Kodlanmış string'i adımlara çevirir. Bozuk ya da beklenmeyen veri asla
 * hata fırlatmaz; geçersiz parçalar atlanır (en kötü ihtimalle boş liste).
 */
export const decodeSteps = (
  encoded: string | null | undefined,
  resolution: number,
): Step[] => {
  if (!encoded || encoded.length > MAX_ENCODED_LENGTH) {
    return [];
  }

  const total = resolution * resolution;
  const steps: Step[] = [];

  for (const rawStep of encoded.split('/')) {
    const step: Step = [];

    for (const rawGroup of rawStep.split(';')) {
      const [hex, rawIndices] = rawGroup.split(':');
      const color = `#${hex}`;

      if (!HEX_PATTERN.test(color) || !rawIndices) {
        continue;
      }

      const indices = rawIndices
        .split('.')
        .map(Number)
        .filter((index) => Number.isInteger(index) && index >= 0 && index < total);

      if (indices.length > 0) {
        step.push({ color, indices });
      }
    }

    if (step.length > 0) {
      steps.push(step);
    }
  }

  return steps;
};

/** İlk `upTo` adımı boş bir tuvale uygulayıp ortaya çıkan pikselleri döner. */
export const replaySteps = (
  steps: readonly Step[],
  resolution: number,
  upTo: number,
  background: string,
): string[] => {
  const pixels = Array.from({ length: resolution * resolution }, () => background);

  for (const step of steps.slice(0, Math.max(0, upTo))) {
    for (const group of step) {
      for (const index of group.indices) {
        pixels[index] = group.color;
      }
    }
  }

  return pixels;
};

/**
 * Oynatma hızı: toplam süre yaklaşık 4-8 sn kalacak şekilde adım başına
 * bekleme (ms). Az adımlı çizimler çok yavaş, çok adımlılar çok hızlı olmaz.
 */
export const getStepIntervalMs = (stepCount: number): number => {
  if (stepCount <= 0) {
    return 0;
  }

  return Math.min(600, Math.max(40, Math.round(6000 / stepCount)));
};
