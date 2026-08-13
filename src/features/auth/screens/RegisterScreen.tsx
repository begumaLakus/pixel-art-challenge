import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';

import { AntiqueColors } from '@/constants/theme';

import { registerUser } from '../services/authServices';

export const RegisterScreen = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const colorScheme = useColorScheme();

  const theme =
    AntiqueColors[colorScheme === 'dark' ? 'dark' : 'light'];

  const handleRegister = async (): Promise<void> => {
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert('Hata', 'Tüm alanları doldurun.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    try {
      setLoading(true);

      await registerUser(email.trim(), password);

      Alert.alert('Başarılı', 'Hesabınız oluşturuldu.');
    } catch {
      Alert.alert(
        'Kayıt başarısız',
        'Hesap oluşturulurken bir hata oluştu.',
      );
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
      <Text style={[styles.title, { color: theme.text }]}>
        Kayıt Ol
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
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
        placeholder="Şifre"
        placeholderTextColor={theme.placeholder}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
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
        placeholder="Şifre tekrar"
        placeholderTextColor={theme.placeholder}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: theme.accent,
            opacity: loading ? 0.6 : 1,
          },
        ]}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text
          style={[
            styles.buttonText,
            { color: theme.background },
          ]}
        >
          {loading
            ? 'Kayıt oluşturuluyor...'
            : 'Kayıt Ol'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/auth/login')}
      >
        <Text
          style={[
            styles.link,
            { color: theme.accent },
          ]}
        >
          Zaten hesabın var mı? Giriş yap
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
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },

  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },

  buttonText: {
    fontWeight: '600',
  },

  link: {
    textAlign: 'center',
    marginTop: 20,
  },
});