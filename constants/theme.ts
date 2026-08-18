import { Platform } from 'react-native';

export const AntiqueColors = {
  light: {
    background: '#0A0714',
    surface: '#140F26',
    text: '#FFFFFF',
    placeholder: '#94A3B8',
    muted: '#64748B',
    border: '#281F45',

    accent: '#FF2A85',
    mint: '#00F5D4',
    gold: '#FFB703',

    success: '#00F5D4',
    danger: '#FF4D6D',
  },

  dark: {
    background: '#0A0714',
    surface: '#140F26',
    text: '#FFFFFF',
    placeholder: '#94A3B8',
    muted: '#64748B',
    border: '#281F45',

    accent: '#FF2A85',
    mint: '#00F5D4',
    gold: '#FFB703',

    success: '#00F5D4',
    danger: '#FF4D6D',
  },
} as const;

/**
 * CyberArcade renk paleti
 */
export const CyberArcade = {
  background: '#0A0714',
  surface: '#140F26',
  border: '#281F45',

  magenta: '#FF2A85',
  mint: '#00F5D4',
  gold: '#FFB703',

  white: '#FFFFFF',
  secondaryText: '#94A3B8',
  mutedText: '#64748B',

  purple: '#7B2CBF',
  goldGlow: 'rgba(255, 183, 3, 0.10)',
  danger: '#FF3B6B',

  magentaGlow: 'rgba(255, 42, 133, 0.12)',
  mintGlow: 'rgba(0, 245, 212, 0.10)',
  purpleGlow: 'rgba(123, 44, 191, 0.12)',

  surfaceRaised: '#1A1430',
  surfacePressed: '#211A3A',


  textPrimary: '#F4F3F8',
  shadowColor: '#1A0B2E',


  surfaceInset: '#0F0B1E',
  borderStrong: '#3D2E63',
  hairlineLight: 'rgba(255, 255, 255, 0.06)',
} as const;


export const Typography = {
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
  system: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }),
} as const;

/** 8pt grid — tüm padding/margin/gap değerleri buradan seçilir. */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

/** Köşe yarıçapı ölçeği — kart/buton/rozet hiyerarşisini tutarlı tutar. */
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;


export const Elevation = {
  card: {
    shadowColor: CyberArcade.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 4,
  },
  raised: {
    shadowColor: CyberArcade.shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 22,
    elevation: 7,
  },
  glowMagenta: {
    shadowColor: CyberArcade.magenta,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 5,
  },
  glowMint: {
    shadowColor: CyberArcade.mint,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  glowGold: {
    shadowColor: CyberArcade.gold,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
} as const;
