import { Platform } from 'react-native';

const tintColorLight = '#5C4033'; // Sıcak Ahşap Kahvesi
const tintColorDark = '#E6D7C3';  // Açık Kum Beji

export const Colors = {
  light: {
    text: '#2C1D11',
    background: '#F5EBE0',
    tint: tintColorLight,
    icon: '#8A735C',
    tabIconDefault: '#8A735C',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F5EBE0',
    background: '#3A2A1D',
    tint: tintColorDark,
    icon: '#B5A28A',
    tabIconDefault: '#B5A28A',
    tabIconSelected: tintColorDark,
  },
};

// Soft Antika / Kum Beji & Ahşap Paleti
export const AntiqueColors = {
  light: {
    background: '#F5EBE0',      // Soft Kum Beji / Sıcak Açık Parşömen
    surface: '#E8D8C8',         // Bir tık koyu kum beji (Input & Kart zemini)
    surfaceLight: '#FFFBF5',    // Çok açık krem (Input içi / vurgulu kartlar)
    text: '#2C1D11',            // Koyu Ceviz / Mürekkep Kahvesi (Okunaklı ve soft)
    textMuted: '#6E5A47',       // Derin Sepia (İkincil metinler)
    placeholder: '#9E8A75',     // Yumuşak Toprak/Sepia (Input placeholder)
    border: '#C4B098',          // Soft Ahşap / Eskitilmiş Bej Çerçeve
    borderDark: '#5C4033',      // Koyu Ahşap Çerçeve (Vurgulu sınırlar için)
    accent: '#4A3525',          // Koyu Ahşap / Meşe (Buton zeminleri - Kırmızı kaldırıldı)
    accentHover: '#3A2A1D',     // Koyu Ceviz
    brass: '#C5A059',           // Yumuşak Pirinç / Antik Altın
    buttonText: '#F5EBE0',      // Buton içi Açık Kum Beji Yazı
  },
  dark: {
    // Koyu mod açılsa dahi siyah/koyu kahveye düşmeyen soft gece sepia tonu
    background: '#4A3525',      // Sıcak Koyu Meşe
    surface: '#3A2A1D',         // Koyu Ceviz Panel
    surfaceLight: '#5C4033',    
    text: '#F5EBE0',            // Kum Beji Yazı
    textMuted: '#C4B098',
    placeholder: '#8A7355',
    border: '#6E5A47',
    borderDark: '#C5A059',
    accent: '#8A735C',          // Açık Ahşap / Taba
    accentHover: '#6E5A47',
    brass: '#D4B06A',
    buttonText: '#2C1D11',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});