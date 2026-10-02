import React, { memo, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/src/theme';

import { buildRuns, toRows } from './pixelRuns';

interface PixelArtProps {
  pixels: readonly string[];
  resolution: number;
  /** Çizimin kenar uzunluğu (px); kare çizilir. */
  size: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Kayıtlı bir çizimi salt okunur gösterir (galeri, arşiv, önizleme). Satır
 * içinde aynı renkli hücreler tek View'da birleştirilir; hücre sınırları
 * tam piksele yuvarlanır ve her satır bir sonrakinin altına 1px taşırılır,
 * böylece parçalar arasında ince çizgiler oluşmaz.
 */
export const PixelArt = memo(
  ({ pixels, resolution, size, style }: PixelArtProps) => {
    const cell = size / resolution;

    const rows = useMemo(
      () =>
        toRows(pixels, resolution, colors.canvasBackground).map((row) =>
          buildRuns(row),
        ),
      [pixels, resolution],
    );

    const edge = (column: number): number => Math.round(column * cell);

    return (
      <View
        accessibilityRole="image"
        accessibilityLabel="Pixel art çizimi"
        style={[{ width: size, height: size }, styles.frame, style]}
      >
        {rows.map((runs, rowIndex) => {
          const rowHeight = edge(rowIndex + 1) - edge(rowIndex);

          return (
            <View
              key={rowIndex}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                height: rowHeight,
                overflow: 'visible',
              }}
            >
              {runs.map((run) => (
                <View
                  key={run.start}
                  style={{
                    width: edge(run.start + run.length) - edge(run.start),
                    // 1px taşma: bir sonraki satır üstünü örter; alt piksel
                    // yuvarlamasından doğan ince dikişler görünmez.
                    height: rowHeight + 1,
                    backgroundColor: run.color,
                  }}
                />
              ))}
            </View>
          );
        })}
      </View>
    );
  },
);

PixelArt.displayName = 'PixelArt';

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: colors.canvasBackground },
});
