import React, { memo } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { CyberArcade } from '@/constants/theme';
import { useMascotAnimation } from '../hooks/useMascotAnimation';

interface ArcadeMascotStageProps {
  themeColor: string;
}


 
export const ArcadeMascotStage = memo(({ themeColor }: ArcadeMascotStageProps) => {
  const { translateX, translateY, opacity } = useMascotAnimation(true);

  return (
    <View pointerEvents="none" style={styles.arcadeStage}>
      <View style={styles.stageLine} />

      <View style={styles.stageLabel}>
        <View style={styles.stageDot} />

        <Text style={styles.stageLabelText}>ARCADE MODE</Text>

        <View style={styles.stageDot} />
      </View>

      <Animated.View
        style={[
          styles.mascot,
          {
            opacity,
            transform: [
              {
                translateX: translateX.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-70, 70],
                }),
              },
              { translateY },
            ],
          },
        ]}
      >
        <View style={styles.mascotGlow} />

        <Text style={styles.mascotText}>👾</Text>
      </Animated.View>

      <View style={[styles.platform, { borderColor: themeColor }]} />

      <View style={styles.stagePixelOne} />
      <View style={styles.stagePixelTwo} />
      <View style={styles.stagePixelThree} />
    </View>
  );
});

ArcadeMascotStage.displayName = 'ArcadeMascotStage';

const styles = StyleSheet.create({
  arcadeStage: {
    height: 96,
    marginTop: 8,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  stageLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 27,
    height: 1,
    backgroundColor: CyberArcade.border,
    opacity: 0.75,
  },

  stageLabel: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  stageDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: CyberArcade.magenta,
    opacity: 0.7,
  },

  stageLabelText: {
    color: CyberArcade.mutedText,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.6,
  },

  mascot: {
    position: 'absolute',
    bottom: 18,
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mascotGlow: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: CyberArcade.magenta,
    opacity: 0.12,
  },

  mascotText: {
    fontSize: 27,
    lineHeight: 34,
    textAlign: 'center',
  },

  platform: {
    position: 'absolute',
    bottom: 11,
    width: 116,
    height: 4,
    borderRadius: 2,
    borderWidth: 1,
    backgroundColor: CyberArcade.surface,
    opacity: 0.8,
  },

  stagePixelOne: {
    position: 'absolute',
    bottom: 10,
    left: '18%',
    width: 3,
    height: 3,
    backgroundColor: CyberArcade.mint,
    opacity: 0.65,
  },

  stagePixelTwo: {
    position: 'absolute',
    bottom: 21,
    right: '21%',
    width: 4,
    height: 4,
    backgroundColor: CyberArcade.gold,
    opacity: 0.55,
  },

  stagePixelThree: {
    position: 'absolute',
    bottom: 34,
    left: '27%',
    width: 2,
    height: 2,
    backgroundColor: CyberArcade.magenta,
    opacity: 0.75,
  },
});
