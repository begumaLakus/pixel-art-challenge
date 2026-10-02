import type { RefObject } from 'react';
import type { View } from 'react-native';

import { SHARE_OUTPUT_WIDTH } from './shareSizes';

/**
 * Web'de görünümü `html2canvas` ile PNG data URI'sine çevirir.
 * `react-native-view-shot` web'de react-native-web'in desteklemediği
 * `findNodeHandle`'ı kullandığı için burada doğrudan DOM düğümü yakalanır.
 */
export const captureView = async (ref: RefObject<View | null>): Promise<string> => {
  const element = ref.current as unknown as HTMLElement | null;

  if (!element) {
    throw new Error('Yakalanacak görünüm bulunamadı.');
  }

  const { default: html2canvas } = await import('html2canvas');

  const canvas = await html2canvas(element, {
    backgroundColor: null,
    // Mantıksal genişlikten çıktı genişliğine ölçekle (1080 px).
    scale: SHARE_OUTPUT_WIDTH / element.getBoundingClientRect().width,
    useCORS: true,
  });

  return canvas.toDataURL('image/png');
};
