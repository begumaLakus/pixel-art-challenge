import { router } from 'expo-router';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';

import { AntiqueColors } from '@/constants/theme';

import { loginUser } from '../services/authServices';

export const LoginScreen = () => {
  const colorScheme = useColorScheme();
  const theme =
    AntiqueColors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (): Promise<void> => {
    if (!email.trim() || !password) {
      setError('Email ve şifre alanlarını doldurun.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await loginUser(email.trim(), password);
    } catch {
      setError('Email veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: theme.text },
        ]}
      >
        Giriş Yap
      </Text>

      <TextInput
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
        placeholder="Email"
        placeholderTextColor={theme.placeholder}
        value={email}
        onChangeText={(value: string) => {
          setEmail(value);
          setError(null);
        }}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
      />

      <TextInput
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
        placeholder="Şifre"
        placeholderTextColor={theme.placeholder}
        value={password}
        onChangeText={(value: string) => {
          setPassword(value);
          setError(null);
        }}
        secureTextEntry
      />

      {error !== null && (
        <Text
          style={[
            styles.errorText,
            { color: theme.accent },
          ]}
        >
          {error}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: theme.accent,
            opacity: loading ? 0.6 : 1,
          },
        ]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text
          style={[
            styles.buttonText,
            { color: '#FFFDFC' },
          ]}
        >
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/auth/register')}
      >
        <Text
          style={[
            styles.link,
            { color: theme.accent },
          ]}
        >
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
  },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },

  errorText: {
    marginBottom: 12,
    fontWeight: '600',
  },

  button: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },

  buttonText: {
    fontWeight: '600',
  },

  link: {
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '600',
  },
});