import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import { AntiqueColors } from '@/constants/theme';
import { loginUser } from '../services/authServices';

export const LoginScreen = () => {
  const colorScheme = useColorScheme();
  const theme = AntiqueColors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async (): Promise<void> => {
    if (!email.trim() || !password) {
      Alert.alert('Hata', 'Email ve şifre alanlarını doldurun.');
      return;
    }

    try {
      setLoading(true);
      await loginUser(email.trim(), password);
    } catch {
      Alert.alert('Giriş başarısız', 'Email veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text, borderColor: theme.brass }]}>
        Giriş Yap
      </Text>

      <TextInput
        style={[
          styles.input,
          {
            color: theme.text,
            borderColor: theme.border,
            backgroundColor: theme.surface,
          },
        ]}
        placeholder="Email"
        placeholderTextColor={theme.placeholder}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
      />

      <TextInput
        style={[
          styles.input,
          {
            color: theme.text,
            borderColor: theme.border,
            backgroundColor: theme.surface,
          },
        ]}
        placeholder="Şifre"
        placeholderTextColor={theme.placeholder}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.accent, borderColor: theme.brass }]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={[styles.buttonText, { color: theme.buttonText }]}>
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/auth/register')}>
        <Text style={[styles.link, { color: theme.brass }]}>
          Hesabın yok mu? Kayıt ol
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    borderBottomWidth: 2,
    paddingBottom: 8,
    alignSelf: 'flex-start',
  },
  input: {
    borderWidth: 2,
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    borderWidth: 2,
    padding: 14,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  link: {
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '600',
  },
});