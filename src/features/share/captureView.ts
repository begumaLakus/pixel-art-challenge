import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { SHARE_OUTPUT_HEIGHT, SHARE_OUTPUT_WIDTH } from './shareSizes';

/**
 * Bir görünümü paylaşım boyutunda PNG'ye çevirir (native: geçici dosya yolu
 * döner). Web'de aynı imzayı `captureView.web.ts` sağlar.
 */
export const captureView = (ref: RefObject<View | null>): Promise<string> =>
  captureRef(ref, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
    width: SHARE_OUTPUT_WIDTH,
    height: SHARE_OUTPUT_HEIGHT,
  });
