import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { Icon } from '@/src/components/ui/Icon';
import { StickerButton } from '@/src/components/ui/StickerButton';
import { TextField } from '@/src/components/ui/TextField';
import { colors, spacing } from '@/src/theme';

import { AuthLayout } from '../components/AuthLayout';
import { loginUser } from '../services/authServices';
import {
  getAuthErrorMessage,
  validateCredentials,
  type CredentialErrors,
} from '../utils/authErrors';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<CredentialErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const handleLogin = async (): Promise<void> => {
    const errors = validateCredentials({ email, password });
    setFieldErrors(errors);
    setFormError(null);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setLoading(true);
      await loginUser(email.trim(), password);
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Giriş yap"
      subtitle="Hesabına gir, arenaya geri dön."
      footer={
        <Pressable
          accessibilityRole="link"
          onPress={() => router.replace('/auth/register')}
          hitSlop={8}
        >
          <AppText variant="body" color={colors.muted}>
            Hesabın yok mu?{' '}
            <AppText variant="heading" color={colors.pink}>
              Kayıt ol
            </AppText>
          </AppText>
        </Pressable>
      }
    >
      <TextField
        label="E-posta"
        icon="email-outline"
        value={email}
        onChangeText={setEmail}
        placeholder="ornek@email.com"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
        error={fieldErrors.email}
      />

      <TextField
        label="Şifre"
        icon="lock-outline"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleLogin}
        error={fieldErrors.password}
        trailing={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
            onPress={() => setShowPassword((current) => !current)}
            hitSlop={10}
          >
            <Icon
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.inkSoft}
            />
          </Pressable>
        }
      />

      {formError ? (
        <View style={styles.formError} accessibilityLiveRegion="polite">
          <Icon name="alert-circle-outline" size={18} color={colors.danger} />
          <AppText variant="caption" color={colors.danger} style={styles.flex}>
            {formError}
          </AppText>
        </View>
      ) : null}

      <StickerButton
        label="Giriş yap"
        icon="arrow-right"
        iconRight
        fullWidth
        loading={loading}
        onPress={handleLogin}
      />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  formError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
