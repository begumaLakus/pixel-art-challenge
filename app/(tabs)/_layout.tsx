import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CyberArcade } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: CyberArcade.magenta,
        tabBarInactiveTintColor: CyberArcade.mutedText,

        tabBarStyle: styles.tabBar,

        tabBarLabelStyle: styles.tabBarLabel,

        tabBarItemStyle: styles.tabBarItem,

        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Arena',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={23}
              name="house.fill"
              color={focused ? CyberArcade.magenta : color}
              weight={focused ? 'bold' : 'regular'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={23}
              name="paperplane.fill"
              color={focused ? CyberArcade.mint : color}
              weight={focused ? 'bold' : 'regular'}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 68,

    backgroundColor: CyberArcade.surface,

    borderTopWidth: 1,
    borderTopColor: CyberArcade.border,

    paddingTop: 7,
    paddingBottom: 9,

    elevation: 0,

    shadowColor: CyberArcade.magenta,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },

  tabBarLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  tabBarItem: {
    paddingVertical: 2,
  },
});