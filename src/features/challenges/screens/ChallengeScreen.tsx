import { CyberArcade } from '@/constants/theme';
import { router } from 'expo-router';
import React, {
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveChallenge } from '../hooks/useActiveChallenge';

const THEME_ASSETS: Record<
  string,
  {
    icon: string;
    label: string;
    color: string;
  }
> = {
  uzay_macerasi: {
    icon: '🚀',
    label: 'UZAY',
    color: '#A855F7',
  },

  cilgin_canlilar: {
    icon: '🐱',
    label: 'CANLILAR',
    color: '#FF922B',
  },

  masalsi_doga: {
    icon: '🍄',
    label: 'DOĞA',
    color: '#51CF66',
  },

  gece_acikmalari: {
    icon: '🍕',
    label: 'YEMEK',
    color: '#FFD43B',
  },

  buyulu_dunyam: {
    icon: '🧙‍♂️',
    label: 'BÜYÜ',
    color: '#CC5DE8',
  },

  nostalji_atari: {
    icon: '🕹️',
    label: 'ATARI',
    color: '#FF6B6B',
  },

  gelecegin_sehri: {
    icon: '🤖',
    label: 'CYBER',
    color: '#339AF0',
  },

  derin_okyanus: {
    icon: '🐙',
    label: 'OKYANUS',
    color: '#22B8CF',
  },

  sevimli_canavarlar: {
    icon: '👾',
    label: 'CANAVAR',
    color: '#F06595',
  },

  cilgin_araclar: {
    icon: '🏎️',
    label: 'ARAÇ',
    color: '#FCC419',
  },

  perili_gece: {
    icon: '👻',
    label: 'PERİLİ',
    color: '#845EF7',
  },

  sira_disi_meslekler: {
    icon: '👨‍🔬',
    label: 'MESLEK',
    color: '#20C997',
  },
};

export const ChallengeScreen = () => {
  const insets = useSafeAreaInsets();

  const {
    challenge,
    loading,
    error,
  } = useActiveChallenge();


  const [timeLeft, setTimeLeft] =
    useState<number>(0);

  /**
   * Decorative arcade movement.
   * Sadece bu ekranda çalışır.
   */
  const mascotTranslateX = useRef(
    new Animated.Value(0),
  ).current;

  const mascotTranslateY = useRef(
    new Animated.Value(0),
  ).current;

  const mascotOpacity = useRef(
    new Animated.Value(0.75),
  ).current;

  useEffect(() => {
    if (!challenge) {
      return;
    }

    const horizontalAnimation =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            mascotTranslateX,
            {
              toValue: 1,
              duration: 4200,
              easing: Easing.inOut(
                Easing.quad,
              ),
              useNativeDriver: true,
            },
          ),
          Animated.timing(
            mascotTranslateX,
            {
              toValue: 0,
              duration: 4200,
              easing: Easing.inOut(
                Easing.quad,
              ),
              useNativeDriver: true,
            },
          ),
        ]),
      );

    const verticalAnimation =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            mascotTranslateY,
            {
              toValue: -7,
              duration: 900,
              easing: Easing.inOut(
                Easing.sin,
              ),
              useNativeDriver: true,
            },
          ),
          Animated.timing(
            mascotTranslateY,
            {
              toValue: 0,
              duration: 900,
              easing: Easing.inOut(
                Easing.sin,
              ),
              useNativeDriver: true,
            },
          ),
        ]),
      );

    const opacityAnimation =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            mascotOpacity,
            {
              toValue: 1,
              duration: 1200,
              easing: Easing.inOut(
                Easing.quad,
              ),
              useNativeDriver: true,
            },
          ),
          Animated.timing(
            mascotOpacity,
            {
              toValue: 0.72,
              duration: 1200,
              easing: Easing.inOut(
                Easing.quad,
              ),
              useNativeDriver: true,
            },
          ),
        ]),
      );

    horizontalAnimation.start();
    verticalAnimation.start();
    opacityAnimation.start();

    return () => {
      horizontalAnimation.stop();
      verticalAnimation.stop();
      opacityAnimation.stop();

      mascotTranslateX.stopAnimation();
      mascotTranslateY.stopAnimation();
      mascotOpacity.stopAnimation();
    };
  }, [
    challenge,
    mascotTranslateX,
    mascotTranslateY,
    mascotOpacity,
  ]);

  useEffect(() => {
    if (!challenge?.endsAt) {
      return;
    }

    const calculateTimeLeft = () => {
      const endTime =
        challenge.endsAt.toDate().getTime();

      setTimeLeft(
        Math.max(
          0,
          endTime - Date.now(),
        ),
      );
    };

    calculateTimeLeft();

    const interval = setInterval(
      calculateTimeLeft,
      1000,
    );

    return () => clearInterval(interval);
  }, [challenge]);

  const formatTimeLeft = (
    milliseconds: number,
  ): string => {
    const totalSeconds = Math.floor(
      milliseconds / 1000,
    );

    const hours = Math.floor(
      totalSeconds / 3600,
    );

    const minutes = Math.floor(
      (totalSeconds % 3600) / 60,
    );

    const seconds =
      totalSeconds % 60;

    return [
      String(hours).padStart(2, '0'),
      String(minutes).padStart(2, '0'),
      String(seconds).padStart(2, '0'),
    ].join(':');
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingBox}>
          <ActivityIndicator
            size="small"
            color={CyberArcade.magenta}
          />

          <Text style={styles.loadingText}>
            ARENA YÜKLENİYOR
          </Text>
        </View>
      </View>
    );
  }

  if (error || !challenge) {
    return (
      <View style={styles.screen}>
        <View style={styles.glowTopRight} />
        <View style={styles.glowBottomLeft} />

        <View style={styles.emptyWrapper}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>
              ⚠
            </Text>

            <Text style={styles.emptyTitle}>
              ARENA BAĞLANTISI YOK
            </Text>

            <Text style={styles.emptyText}>
              {error ??
                'Şu anda aktif bir challenge bulunmuyor.'}
            </Text>

            <Pressable
              onPress={() => router.back()}
              style={styles.emptyButton}
            >
              <Text
                style={
                  styles.emptyButtonText
                }
              >
                GERİ DÖN
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const challengeEnded =
    timeLeft <= 0;

  const themeAsset =
    THEME_ASSETS[challenge.theme] ?? {
      icon: '🎨',
      label:
        challenge.theme.toUpperCase(),
      color: CyberArcade.magenta,
    };

  return (
    <View style={styles.screen}>
      <View
        pointerEvents="none"
        style={styles.glowTopRight}
      />

      <View
        pointerEvents="none"
        style={styles.glowBottomLeft}
      />

      <ScrollView
  showsVerticalScrollIndicator={false}
  bounces={false}
  contentContainerStyle={[
    styles.scrollContent,
    {
      paddingTop: insets.top + 22,
      paddingBottom: insets.bottom + 32,
    },
  ]}
>
        <View style={styles.wrapper}>
          {/* HEADER */}

          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backText}>
                ← ARENA
              </Text>
            </Pressable>

            <View
              style={styles.headerBadge}
            >
              <View
                style={styles.headerDot}
              />

              <Text
                style={
                  styles.headerBadgeText
                }
              >
                LIVE CHALLENGE
              </Text>
            </View>
          </View>

          {/* HERO */}

          <View
            style={[
              styles.heroCard,
              {
                borderColor:
                  themeAsset.color,
              },
            ]}
          >
            <View
              style={[
                styles.heroOrb,
                {
                  backgroundColor:
                    themeAsset.color,
                },
              ]}
            />

            <View style={styles.heroTop}>
              <View
                style={styles.themeBadge}
              >
                <Text
                  style={
                    styles.themeBadgeIcon
                  }
                >
                  {themeAsset.icon}
                </Text>

                <Text
                  style={[
                    styles.themeBadgeText,
                    {
                      color:
                        themeAsset.color,
                    },
                  ]}
                >
                  {themeAsset.label}
                </Text>
              </View>

              <View
                style={styles.liveStatus}
              >
                <View
                  style={
                    styles.liveStatusDot
                  }
                />

                <Text
                  style={
                    styles.liveStatusText
                  }
                >
                  ACTIVE
                </Text>
              </View>
            </View>

            <Text
              style={styles.missionLabel}
            >
              TODAY'S MISSION
            </Text>

            <Text style={styles.title}>
              {challenge.title}
            </Text>

            <Text
              style={styles.description}
            >
              {challenge.description}
            </Text>

            {/* TIMER */}

            <View
              style={styles.timerPanel}
            >
              <View>
                <Text
                  style={styles.timerLabel}
                >
                  REMAINING TIME
                </Text>

                <Text
                  style={[
                    styles.timer,
                    challengeEnded &&
                      styles.timerEnded,
                  ]}
                >
                  {challengeEnded
                    ? '00:00:00'
                    : formatTimeLeft(
                        timeLeft,
                      )}
                </Text>
              </View>

              <View
                style={styles.timerIcon}
              >
                <Text
                  style={
                    styles.timerIconText
                  }
                >
                  ⏱
                </Text>
              </View>
            </View>
          </View>

          {/* ACTIONS */}

          <View style={styles.actions}>
            <Pressable
              disabled={challengeEnded}
              onPress={() =>
                router.push({
                  pathname: '/editor',
                  params: {
                    challengeId:
                      challenge.id,
                  },
                })
              }
              style={({ pressed }) => [
                styles.primaryButton,
                challengeEnded &&
                  styles.disabledButton,
                pressed &&
                  !challengeEnded &&
                  styles.buttonPressed,
              ]}
            >
              <View
                style={
                  styles.primaryButtonIcon
                }
              >
                <Text
                  style={
                    styles.primaryButtonIconText
                  }
                >
                  ✦
                </Text>
              </View>

              <View
                style={
                  styles.primaryButtonCopy
                }
              >
                <Text
                  style={
                    styles.primaryButtonEyebrow
                  }
                >
                  CREATE
                </Text>

                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  PIXEL ART OLUŞTUR
                </Text>
              </View>

              <Text
                style={styles.primaryArrow}
              >
                →
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                router.push({
                  pathname:
                    '/submissions',
                  params: {
                    challengeId:
                      challenge.id,
                  },
                })
              }
              style={({ pressed }) => [
                styles.galleryButton,
                pressed &&
                  styles.buttonPressed,
              ]}
            >
              <Text
                style={styles.galleryIcon}
              >
                ◈
              </Text>

              <Text
                style={styles.galleryText}
              >
                TOPLULUK GALERİSİ
              </Text>

              <Text
                style={styles.galleryArrow}
              >
                →
              </Text>
            </Pressable>
          </View>

          {/* INFO */}

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text
                style={styles.infoValue}
              >
                24H
              </Text>

              <Text
                style={styles.infoLabel}
              >
                CHALLENGE
              </Text>
            </View>

            <View
              style={styles.infoDivider}
            />

            <View style={styles.infoItem}>
              <Text
                style={[
                  styles.infoValue,
                  {
                    color:
                      CyberArcade.mint,
                  },
                ]}
              >
                LIVE
              </Text>

              <Text
                style={styles.infoLabel}
              >
                OYLAMA
              </Text>
            </View>

            <View
              style={styles.infoDivider}
            />

            <View style={styles.infoItem}>
              <Text
                style={[
                  styles.infoValue,
                  {
                    color:
                      CyberArcade.gold,
                  },
                ]}
              >
                🏆
              </Text>

              <Text
                style={styles.infoLabel}
              >
                ÖDÜL
              </Text>
            </View>
          </View>

          {/* ARCADE DECORATION */}

          <View
            pointerEvents="none"
            style={styles.arcadeStage}
          >
            <View
              style={styles.stageLine}
            />

            <View
              style={styles.stageLabel}
            >
              <View
                style={styles.stageDot}
              />

              <Text
                style={styles.stageLabelText}
              >
                ARCADE MODE
              </Text>

              <View
                style={styles.stageDot}
              />
            </View>

            <Animated.View
              style={[
                styles.mascot,
                {
                  opacity:
                    mascotOpacity,
                  transform: [
                    {
                      translateX:
                        mascotTranslateX.interpolate(
                          {
                            inputRange: [
                              0,
                              1,
                            ],
                            outputRange: [
                              -70,
                              70,
                            ],
                          },
                        ),
                    },
                    {
                      translateY:
                        mascotTranslateY,
                    },
                  ],
                },
              ]}
            >
              <View
                style={
                  styles.mascotGlow
                }
              />

              <Text
                style={styles.mascotText}
              >
                👾
              </Text>
            </Animated.View>

            <View
              style={[
                styles.platform,
                {
                  borderColor:
                    themeAsset.color,
                },
              ]}
            />

            <View
              style={styles.stagePixelOne}
            />

            <View
              style={styles.stagePixelTwo}
            />

            <View
              style={styles.stagePixelThree}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor:
      CyberArcade.background,
    position: 'relative',
  },

  loadingScreen: {
    flex: 1,
    backgroundColor:
      CyberArcade.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: CyberArcade.mutedText,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  scrollContent: {
    flexGrow: 1,

  },

wrapper: {
  width: '100%',
  maxWidth: 480,
  alignSelf: 'center',
  paddingHorizontal: 18,
},

  glowTopRight: {
    position: 'absolute',
    top: -90,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor:
      CyberArcade.purple,
    opacity: 0.12,
  },

  glowBottomLeft: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor:
      CyberArcade.magenta,
    opacity: 0.12,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },

  backText: {
    color: CyberArcade.secondaryText,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor:
      CyberArcade.mintGlow,
    borderWidth: 1,
    borderColor:
      'rgba(0, 245, 212, 0.25)',
  },

  headerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor:
      CyberArcade.mint,
    marginRight: 6,
  },

  headerBadgeText: {
    color: CyberArcade.mint,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor:
      CyberArcade.surface,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    shadowColor:
      CyberArcade.magenta,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 7,
  },

  heroOrb: {
    position: 'absolute',
    top: -90,
    right: -70,
    width: 210,
    height: 210,
    borderRadius: 105,
    opacity: 0.06,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  themeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor:
      CyberArcade.background,
    borderWidth: 1,
    borderColor:
      CyberArcade.border,
  },

  themeBadgeIcon: {
    fontSize: 13,
    marginRight: 6,
  },

  themeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  liveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  liveStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor:
      CyberArcade.magenta,
    marginRight: 6,
  },

  liveStatusText: {
    color: CyberArcade.magenta,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  missionLabel: {
    marginTop: 26,
    color: CyberArcade.mint,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.8,
  },

  title: {
    marginTop: 5,
    color: CyberArcade.white,
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '900',
    letterSpacing: -0.8,
  },

  description: {
    marginTop: 10,
    color: CyberArcade.secondaryText,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },

  timerPanel: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
    borderRadius: 12,
    backgroundColor:
      CyberArcade.background,
    borderWidth: 1,
    borderColor:
      CyberArcade.border,
  },

  timerLabel: {
    color: CyberArcade.mutedText,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 4,
  },

  timer: {
    color: CyberArcade.magenta,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },

  timerEnded: {
    color: CyberArcade.danger,
  },

  timerIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      CyberArcade.magentaGlow,
    borderWidth: 1,
    borderColor:
      'rgba(255, 42, 133, 0.2)',
  },

  timerIconText: {
    color: CyberArcade.magenta,
    fontSize: 20,
  },

  actions: {
    marginTop: 12,
    gap: 10,
  },

  primaryButton: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor:
      CyberArcade.magenta,
    borderWidth: 1,
    borderColor: '#FF69A8',
    shadowColor:
      CyberArcade.magenta,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 4,
  },

  primaryButtonIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(0, 0, 0, 0.14)',
  },

  primaryButtonIconText: {
    color: CyberArcade.white,
    fontSize: 22,
    fontWeight: '900',
  },

  primaryButtonCopy: {
    flex: 1,
    marginLeft: 12,
  },

  primaryButtonEyebrow: {
    color:
      'rgba(255,255,255,0.7)',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 2,
  },

  primaryButtonText: {
    color: CyberArcade.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  primaryArrow: {
    color: CyberArcade.white,
    fontSize: 22,
    fontWeight: '900',
  },

  galleryButton: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor:
      CyberArcade.surface,
    borderWidth: 1,
    borderColor:
      CyberArcade.border,
  },

  galleryIcon: {
    color: CyberArcade.mint,
    fontSize: 19,
    marginRight: 10,
  },

  galleryText: {
    flex: 1,
    color: CyberArcade.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  galleryArrow: {
    color:
      CyberArcade.secondaryText,
    fontSize: 19,
    fontWeight: '900',
  },

  buttonPressed: {
    transform: [
      {
        translateY: 3,
      },
    ],
    opacity: 0.88,
  },

  disabledButton: {
    opacity: 0.35,
  },

  infoRow: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor:
      CyberArcade.border,
  },

  infoItem: {
    alignItems: 'center',
    minWidth: 70,
  },

  infoDivider: {
  width: 1,
  height: 24,
  backgroundColor: CyberArcade.border,
},


  infoValue: {
    color: CyberArcade.gold,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  infoLabel: {
    marginTop: 4,
    color: CyberArcade.mutedText,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
  },

  /*
   * -----------------------------------------
   * ARCADE STAGE
   * -----------------------------------------
   *
   * Bu bölüm sadece ChallengeScreen'de bulunur.
   * Küçük bir arcade karakteri sağa-sola hareket eder.
   */

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
    backgroundColor:
      CyberArcade.border,
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
    gap: 7,
  },

  stageDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor:
      CyberArcade.magenta,
    opacity: 0.7,
  },

  stageLabelText: {
    color: CyberArcade.mutedText,
    fontSize: 7,
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
    backgroundColor:
      CyberArcade.magenta,
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
    backgroundColor:
      CyberArcade.surface,
    opacity: 0.8,
  },

  stagePixelOne: {
    position: 'absolute',
    bottom: 10,
    left: '18%',
    width: 3,
    height: 3,
    backgroundColor:
      CyberArcade.mint,
    opacity: 0.65,
  },

  stagePixelTwo: {
    position: 'absolute',
    bottom: 21,
    right: '21%',
    width: 4,
    height: 4,
    backgroundColor:
      CyberArcade.gold,
    opacity: 0.55,
  },

  stagePixelThree: {
    position: 'absolute',
    bottom: 34,
    left: '27%',
    width: 2,
    height: 2,
    backgroundColor:
      CyberArcade.magenta,
    opacity: 0.75,
  },

  emptyWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },

  emptyCard: {
    width: '100%',
    alignItems: 'center',
    padding: 26,
    borderRadius: 18,
    backgroundColor:
      CyberArcade.surface,
    borderWidth: 1,
    borderColor:
      CyberArcade.border,
  },

  emptyIcon: {
    color: CyberArcade.magenta,
    fontSize: 34,
    marginBottom: 12,
  },

  emptyTitle: {
    color: CyberArcade.white,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
  },

  emptyText: {
    color:
      CyberArcade.secondaryText,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
  },

  emptyButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 9,
    borderWidth: 1,
    borderColor:
      CyberArcade.magenta,
    backgroundColor:
      CyberArcade.magentaGlow,
  },

  emptyButtonText: {
    color: CyberArcade.magenta,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
});