import { colors } from '@/src/theme';
import {
  getThemeSprite,
  stableHash,
  type SpriteName,
} from '@/src/theme/sprites';

/**
 * Günün temasına göre değişen tek şey vurgu rengi ve ikon sprite'ıdır;
 * zemin, kontur ve yerleşim hep aynı kalır. Gemini'nin ürettiği yeni
 * temalar da tema adından deterministik olarak bir renk/sprite alır.
 */
export const THEME_ACCENTS = [
  colors.lime,
  colors.yellow,
  '#FF8FB1',
  colors.sky,
  '#7FE3C4',
  '#CDB4FF',
  '#FFB26B',
] as const;

export interface ChallengeThemeStyle {
  sprite: SpriteName;
  accent: string;
}

export const getChallengeThemeStyle = (theme: string): ChallengeThemeStyle => ({
  sprite: getThemeSprite(theme),
  accent: THEME_ACCENTS[stableHash(theme) % THEME_ACCENTS.length],
});
