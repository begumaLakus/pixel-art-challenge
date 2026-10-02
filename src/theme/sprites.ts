import { colors } from './index';

/**
 * Uygulamanın kendi pixel art illüstrasyonları. Emoji platforma göre farklı
 * göründüğü için tema ikonları ve maskot burada karakter haritası olarak
 * tutulur ve `PixelSprite` ile çizilir.
 */
export const SPRITE_PALETTE: Record<string, string> = {
  K: colors.ink,
  W: colors.white,
  R: colors.pink,
  Y: colors.yellow,
  G: colors.green,
  L: colors.lime,
  B: '#3B82F6',
  P: '#8B5CF6',
  O: '#FF8A3D',
  S: colors.sky,
};

export type SpriteName =
  | 'pixo'
  | 'alien'
  | 'cat'
  | 'mushroom'
  | 'pizza'
  | 'ghost'
  | 'robot'
  | 'star'
  | 'heart'
  | 'fish'
  | 'car'
  | 'trophy'
  | 'flame';

export const SPRITES: Record<SpriteName, string[]> = {
  // Uygulamanın maskotu "Pixo".
  pixo: [
    '..KKKKK..',
    '.KLLLLLK.',
    'KLLLLLLLK',
    'KLKLLLKLK',
    'KLLLLLLLK',
    'KLRLLLRLK',
    '.KLLKLLK.',
    '..KKKKK..',
  ],
  alien: [
    '..P..P..',
    '...PP...',
    '..PPPP..',
    '.PP.PP.P',
    '.PPPPPPP',
    '.P.PP.P.',
    '.P....P.',
    '..P..P..',
  ],
  cat: [
    'O......O',
    'OO....OO',
    'OOOOOOOO',
    'OKOOOOKO',
    'OOOOOOOO',
    'OOORROOO',
    'OOOOOOOO',
    '.OOOOOO.',
  ],
  mushroom: [
    '..RRRR..',
    '.RRWWRR.',
    'RRRWWRRR',
    'RWWRRWWR',
    'RRRRRRRR',
    '..WWWW..',
    '..WKKW..',
    '..WWWW..',
  ],
  pizza: [
    'OOOOOOOO',
    'OYYYYYYO',
    '.YRYYRY.',
    '.YYYYYY.',
    '..YRYY..',
    '..YYYY..',
    '...YY...',
    '...Y....',
  ],
  ghost: [
    '..WWWW..',
    '.WWWWWW.',
    'WKKWWKKW',
    'WKKWWKKW',
    'WWWWWWWW',
    'WWWWWWWW',
    'WW.WW.WW',
    'W..WW..W',
  ],
  robot: [
    '...KK...',
    '...SS...',
    '.SSSSSS.',
    'SKSSSSKS',
    'SSSSSSSS',
    'SKKKKKKS',
    '.SSSSSS.',
    '.SS..SS.',
  ],
  star: [
    '...Y....',
    '...Y....',
    'YYYYYYY.',
    '.YYYYY..',
    '..YYY...',
    '.YY.YY..',
    '.Y...Y..',
    '........',
  ],
  heart: [
    '..RR.RR.',
    '.RRRRRRR',
    '.RRWRRRR',
    '.RRRRRRR',
    '..RRRRR.',
    '...RRR..',
    '....R...',
    '........',
  ],
  fish: [
    '..B.....',
    '.BBB..B.',
    'BBKBBBBB',
    'BBBBBBBB',
    '.BBB..B.',
    '..B.....',
  ],
  car: [
    '........',
    '..SSSS..',
    '.SSSSSS.',
    'YYYYYYYY',
    'YKKYYKKY',
    '.KK..KK.',
  ],
  trophy: [
    'YYYYYYYY',
    'YYWYYYYY',
    '.YYYYYY.',
    '..YYYY..',
    '...YY...',
    '...YY...',
    '..OOOO..',
    '.OOOOOO.',
  ],
  flame: [
    '...R....',
    '..RR....',
    '..RRR.R.',
    '.RRYRRR.',
    '.RRYYRR.',
    '.RYYYYR.',
    '..RYYR..',
    '...RR...',
  ],
};

const THEME_SPRITES: Record<string, SpriteName> = {
  uzay_macerasi: 'alien',
  cilgin_canlilar: 'cat',
  masalsi_doga: 'mushroom',
  gece_acikmalari: 'pizza',
  buyulu_dunyam: 'star',
  nostalji_atari: 'alien',
  gelecegin_sehri: 'robot',
  derin_okyanus: 'fish',
  sevimli_canavarlar: 'alien',
  cilgin_araclar: 'car',
  perili_gece: 'ghost',
  sira_disi_meslekler: 'robot',
};

const FALLBACK_SPRITES: SpriteName[] = [
  'cat',
  'mushroom',
  'ghost',
  'robot',
  'star',
  'fish',
  'pizza',
  'alien',
];

/** Aynı metin için her zaman aynı sayıyı veren basit, sabit karma. */
export const stableHash = (value: string): number => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 997;
  }

  return hash;
};

/**
 * Temaya uygun sprite. Gemini'nin ürettiği yeni (haritada olmayan) temalar
 * için tema adından deterministik bir sprite seçilir; böylece aynı tema her
 * yerde aynı görünür.
 */
export const getThemeSprite = (theme: string): SpriteName =>
  THEME_SPRITES[theme] ??
  FALLBACK_SPRITES[stableHash(theme) % FALLBACK_SPRITES.length];
