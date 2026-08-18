import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

interface MascotAnimationValues {
  translateX: Animated.Value;
  translateY: Animated.Value;
  opacity: Animated.Value;
}

/**
 * Salt dekoratif arcade maskot hareketi. Önceden ChallengeScreen içinde
 * 3 ayrı Animated.Value + start/stop yönetimiyle iş mantığına karışmış
 * haldeydi; artık ArcadeMascotStage component'i dışında hiçbir yerden
 * kullanılmıyor.
 */
export const useMascotAnimation = (active: boolean): MascotAnimationValues => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.75)).current;

  useEffect(() => {
    if (!active) {
      return;
    }

    const horizontalAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: 1,
          duration: 4200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 4200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const verticalAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -7,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const opacityAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.72,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    horizontalAnimation.start();
    verticalAnimation.start();
    opacityAnimation.start();

    return () => {
      horizontalAnimation.stop();
      verticalAnimation.stop();
      opacityAnimation.stop();

      translateX.stopAnimation();
      translateY.stopAnimation();
      opacity.stopAnimation();
    };
  }, [active, translateX, translateY, opacity]);

  return { translateX, translateY, opacity };
};
