import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { Icon } from '@/src/components/ui/Icon';
import { StickerButton } from '@/src/components/ui/StickerButton';
import { TextField } from '@/src/components/ui/TextField';
import { colors, spacing } from '@/src/theme';

import { AuthLayout } from '../components/AuthLayout';
import { registerUser } from '../services/authServices';
import {
  getAuthErrorMessage,
  validateCredentials,
  type CredentialErrors,
} from '../utils/authErrors';

export const RegisterScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<CredentialErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const handleRegister = async (): Promise<void> => {
    const errors = validateCredentials({ email, password, confirmPassword });
    setFieldErrors(errors);
    setFormError(null);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setLoading(true);
      await registerUser(email.trim(), password);
      // Başarılı kayıtta oturum açılır; AuthGate seni ana ekrana yönlendirir.
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Kayıt ol"
      subtitle="Hesap aç, ilk pixel art'ını çiz."
      footer={
        <Pressable
          accessibilityRole="link"
          onPress={() => router.replace('/auth/login')}
          hitSlop={8}
        >
          <AppText variant="body" color={colors.muted}>
            Zaten hesabın var mı?{' '}
            <AppText variant="heading" color={colors.pink}>
              Giriş yap
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
        placeholder="En az 6 karakter"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
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

      <TextField
        label="Şifre tekrarı"
        icon="lock-check-outline"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Şifreni tekrar yaz"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={handleRegister}
        error={fieldErrors.confirmPassword}
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
        label="Hesap oluştur"
        icon="arrow-right"
        iconRight
        fullWidth
        loading={loading}
        onPress={handleRegister}
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
