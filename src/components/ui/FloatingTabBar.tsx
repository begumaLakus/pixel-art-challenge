import type { BottomTabBarProps } from "expo-router/js-tabs";
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, MAX_CONTENT_WIDTH, radius, spacing, stroke } from '@/src/theme';

import { Icon, type IconName } from './Icon';
import { StickerBox } from './StickerBox';

const TAB_ICONS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Arena', icon: 'home-variant' },
  gallery: { label: 'Galeri', icon: 'image-multiple' },
  archive: { label: 'Şampiyonlar', icon: 'trophy' },
  profile: { label: 'Profil', icon: 'account' },
};

/** İçeriğin tab bar'ın altında kalmaması için ekranların ayıracağı alan. */
export const TAB_BAR_SPACE = 96;

/**
 * Ekranın altında yüzen, hap şeklinde sticker tab bar. Aktif sekme lime
 * dolgulu hapla işaretlenir.
 */
export const FloatingTabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { paddingBottom: insets.bottom + spacing.sm }]}
    >
      <StickerBox
        radius={radius.pill}
        offset={4}
        style={styles.bar}
        contentStyle={styles.row}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const config = TAB_ICONS[route.name];

          if (!config) {
            return null;
          }

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              if (Platform.OS !== 'web') {
                void Haptics.selectionAsync();
              }

              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={
                descriptors[route.key].options.title ?? config.label
              }
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              style={[styles.tab, focused && styles.tabActive]}
            >
              <Icon name={config.icon} size={24} />
            </Pressable>
          );
        })}
      </StickerBox>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  bar: { width: '100%', maxWidth: MAX_CONTENT_WIDTH - spacing.xl * 2 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.xs + 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: radius.pill,
    borderWidth: stroke.thin,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: colors.lime,
    borderColor: colors.ink,
  },
});
