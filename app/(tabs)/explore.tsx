import { StyleSheet, Text, View } from 'react-native';

import { AntiqueColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ExploreScreen() {
  const colorScheme = useColorScheme();

  const theme =
    AntiqueColors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <Text style={[styles.title, { color: theme.text }]}>
        Keşfet
      </Text>

      <Text style={[styles.subtitle, { color: theme.placeholder }]}>
        Yakında burada yeni içerikler olacak.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
});