/**
 * Tasarım sistemi tokenları ("sticker pop"): düz krem zemin, kalın siyah
 * kontur, sert (bulanıksız) ofset gölge ve tek bir vurgu rengi. Ekranlar
 * ham değer yerine bu dosyadan okur.
 */
export const colors = {
  paper: '#FFF8E7',
  paperDeep: '#F4EBD3',
  ink: '#151515',
  inkSoft: '#3B3B3B',
  muted: '#6B6B6B',
  white: '#FFFFFF',

  lime: '#C6F432',
  pink: '#FF5C7A',
  yellow: '#FFD21F',
  green: '#1E7F4A',
  sky: '#8FD3FF',
  danger: '#E5484D',

  canvas: '#FFFFFF',
  canvasBackground: '#FDFBF7',
  gridLine: '#E4DFCF',
} as const;

export type ColorName = keyof typeof colors;

export const fonts = {
  body: 'SpaceGrotesk_500Medium',
  bold: 'SpaceGrotesk_700Bold',
  pixel: 'Silkscreen_400Regular',
  pixelBold: 'Silkscreen_700Bold',
} as const;

/** 4pt tabanlı boşluk ölçeği. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

/** Kontur kalınlıkları. */
export const stroke = {
  thin: 2,
  base: 2.5,
} as const;

/** Sert gölgenin kayma miktarı (px). */
export const shadowOffset = {
  sm: 2,
  md: 3,
  lg: 5,
} as const;

/** Ekranlarda içeriğin en fazla genişliği (tablet/web'de ortalanır). */
export const MAX_CONTENT_WIDTH = 480;
