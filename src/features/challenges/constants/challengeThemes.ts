export interface ChallengeThemeAsset {
  icon: string;
  label: string;
  color: string;
}

/**
 * Tema -> ikon/etiket/renk eşlemesi. Daha önce ChallengeScreen.tsx içinde
 * local ve export edilmemiş haldeydi; submissions/archive ekranları aynı
 * rozeti tutarlı göstermek için bu haritayı paylaşmalı.
 */
export const CHALLENGE_THEME_ASSETS: Record<string, ChallengeThemeAsset> = {
  uzay_macerasi: { icon: '🚀', label: 'UZAY', color: '#A855F7' },
  cilgin_canlilar: { icon: '🐱', label: 'CANLILAR', color: '#FF922B' },
  masalsi_doga: { icon: '🍄', label: 'DOĞA', color: '#51CF66' },
  gece_acikmalari: { icon: '🍕', label: 'YEMEK', color: '#FFD43B' },
  buyulu_dunyam: { icon: '🧙‍♂️', label: 'BÜYÜ', color: '#CC5DE8' },
  nostalji_atari: { icon: '🕹️', label: 'ATARI', color: '#FF6B6B' },
  gelecegin_sehri: { icon: '🤖', label: 'CYBER', color: '#339AF0' },
  derin_okyanus: { icon: '🐙', label: 'OKYANUS', color: '#22B8CF' },
  sevimli_canavarlar: { icon: '👾', label: 'CANAVAR', color: '#F06595' },
  cilgin_araclar: { icon: '🏎️', label: 'ARAÇ', color: '#FCC419' },
  perili_gece: { icon: '👻', label: 'PERİLİ', color: '#845EF7' },
  sira_disi_meslekler: { icon: '👨‍🔬', label: 'MESLEK', color: '#20C997' },
};

export const getChallengeThemeAsset = (
  theme: string,
  fallbackColor: string,
): ChallengeThemeAsset =>
  CHALLENGE_THEME_ASSETS[theme] ?? {
    icon: '🎨',
    label: theme.toUpperCase(),
    color: fallbackColor,
  };
