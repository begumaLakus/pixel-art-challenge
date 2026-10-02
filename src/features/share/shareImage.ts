import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/** Paylaşılan dosyanın adı; boşluk ve özel karakterlerden arındırılır. */
export const buildShareFileName = (title: string): string => {
  const slug = title
    .toLocaleLowerCase('tr-TR')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `pixel-art-${slug || 'cizim'}.png`;
};

/**
 * Üretilen görseli paylaşır. Native'de sistem paylaşım menüsünü açar; web'de
 * (paylaşım menüsü yaygın olmadığı için) görseli indirir.
 *
 * `uri`: native'de dosya yolu, web'de data URI.
 */
export const shareImage = async (uri: string, fileName: string): Promise<void> => {
  if (Platform.OS === 'web') {
    const link = document.createElement('a');
    link.href = uri;
    link.download = fileName;
    link.click();
    return;
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Bu cihazda paylaşım desteklenmiyor.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle: 'Çizimini paylaş',
    UTI: 'public.png',
  });
};
