import { Tabs } from 'expo-router';
import React from 'react';

import { FloatingTabBar } from '@/src/components/ui/FloatingTabBar';
import { colors } from '@/src/theme';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Arena' }} />
      <Tabs.Screen name="gallery" options={{ title: 'Galeri' }} />
      <Tabs.Screen name="archive" options={{ title: 'Şampiyonlar' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
