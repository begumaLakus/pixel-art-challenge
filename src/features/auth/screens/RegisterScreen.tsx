import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppAlert } from '@/src/components/ui/AppAlert';
import {
  CyberArcade,
  Elevation,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';

import { registerUser } from '../services/authServices';

type FieldName = 'email' | 'password' | 'confirmPassword';

/**
 * Premium kayıt ekranı. Kayıt mantığı (registerUser, AppAlert.alert akışı)
 * aynı — sadece JSX/stil LoginScreen ile aynı tasarım dilinde (marka
 * rozeti, kart, ikonlu input'lar, KeyboardAvoidingView) yeniden kuruldu.
 */
export const RegisterScreen = () => {
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<FieldName | null>(null);

  const handleRegister = async (): Promise<void> => {
    if (!email.trim() || !password || !confirmPassword) {
      AppAlert.alert('Hata', 'Tüm alanları doldurun.');
      return;
    }

    if (password !== confirmPassword) {
      AppAlert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    try {
      setLoading(true);

      await registerUser(email.trim(), password);

      AppAlert.alert('Başarılı', 'Hesabınız oluşturuldu.');
    } catch {
      AppAlert.alert(
        'Kayıt başarısız',
        'Hesap oluşturulurken bir hata oluştu.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.screen}>
        <View pointerEvents="none" style={styles.glowTopRight} />
        <View pointerEvents="none" style={styles.glowBottomLeft} />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + Spacing.xl,
              paddingBottom: insets.bottom + Spacing.xl,
            },
          ]}
        >
          <View style={styles.wrapper}>
            {/* MARKA */}
            <View style={styles.brandMark}>
              <View style={styles.brandMarkGlow} />

              <View style={styles.pixelLogo}>
                <View style={[styles.pixelDot, styles.pixelDotMagenta]} />
                <View style={[styles.pixelDot, styles.pixelDotMint]} />
                <View style={[styles.pixelDot, styles.pixelDotGold]} />
                <View style={[styles.pixelDot, styles.pixelDotPurple]} />
              </View>
            </View>

            <View style={styles.brandBadge}>
              <View style={styles.brandDot} />
              <Text style={styles.brandBadgeText}>PIXEL ART ARENA</Text>
            </View>

            <Text style={styles.title}>Kayıt Ol</Text>
            <Text style={styles.subtitle}>
              Aramıza katıl, ilk pixel art'ını oluştur.
            </Text>

            {/* FORM KARTI */}
            <View style={styles.card}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>EMAIL</Text>

                <View
                  style={[
                    styles.inputRow,
                    focusedField === 'email' && styles.inputRowFocused,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={
                      focusedField === 'email'
                        ? CyberArcade.magenta
                        : CyberArcade.mutedText
                    }
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="ornek@email.com"
                    placeholderTextColor={CyberArcade.mutedText}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>ŞİFRE</Text>

                <View
                  style={[
                    styles.inputRow,
                    focusedField === 'password' && styles.inputRowFocused,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={
                      focusedField === 'password'
                        ? CyberArcade.magenta
                        : CyberArcade.mutedText
                    }
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={CyberArcade.mutedText}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'
                    }
                    hitSlop={8}
                    onPress={() => setShowPassword((prev) => !prev)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={CyberArcade.mutedText}
                    />
                  </Pressable>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>ŞİFRE TEKRAR</Text>

                <View
                  style={[
                    styles.inputRow,
                    focusedField === 'confirmPassword' &&
                      styles.inputRowFocused,
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color={
                      focusedField === 'confirmPassword'
                        ? CyberArcade.magenta
                        : CyberArcade.mutedText
                    }
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={CyberArcade.mutedText}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Kayıt ol"
                style={({ pressed }) => [
                  styles.primaryButton,
                  loading && styles.primaryButtonDisabled,
                  pressed && !loading && styles.primaryButtonPressed,
                ]}
                onPress={handleRegister}
                disabled={loading}
              >
                <View style={styles.primaryButtonSheen} />

                {loading ? (
                  <ActivityIndicator size="small" color={CyberArcade.white} />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Kayıt Ol</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={17}
                      color={CyberArcade.white}
                    />
                  </>
                )}
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Giriş yap"
              hitSlop={8}
              style={styles.linkRow}
              onPress={() => router.replace('/auth/login')}
            >
              <Text style={styles.linkText}>
                Zaten hesabın var mı?{' '}
                <Text style={styles.linkTextAccent}>Giriş yap</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  screen: {
    flex: 1,
    backgroundColor: CyberArcade.background,
    position: 'relative',
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  wrapper: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },

  glowTopRight: {
    position: 'absolute',
    top: -88,
    right: -80,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: CyberArcade.purple,
    opacity: 0.14,
  },

  glowBottomLeft: {
    position: 'absolute',
    bottom: -96,
    left: -96,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: CyberArcade.magenta,
    opacity: 0.12,
  },

  brandMark: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CyberArcade.surface,
    borderWidth: 1,
    borderColor: CyberArcade.border,
    marginBottom: Spacing.md,
    ...Elevation.glowMagenta,
  },

  brandMarkGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: CyberArcade.magenta,
    opacity: 0.1,
  },

  pixelLogo: {
    width: 28,
    height: 28,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },

  pixelDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },

  pixelDotMagenta: { backgroundColor: CyberArcade.magenta },
  pixelDotMint: { backgroundColor: CyberArcade.mint },
  pixelDotGold: { backgroundColor: CyberArcade.gold },
  pixelDotPurple: { backgroundColor: CyberArcade.purple },

  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.sm,
    backgroundColor: CyberArcade.surface,
    borderWidth: 1,
    borderColor: CyberArcade.border,
    marginBottom: Spacing.md,
  },

  brandDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: CyberArcade.mint,
    marginRight: Spacing.xs + 2,
  },

  brandBadgeText: {
    color: CyberArcade.secondaryText,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  title: {
    color: CyberArcade.textPrimary,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.4,
    fontFamily: Typography.mono,
    textAlign: 'center',
  },

  subtitle: {
    marginTop: Spacing.xs,
    color: CyberArcade.secondaryText,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: Typography.system,
  },

  card: {
    width: '100%',
    marginTop: Spacing.xl,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    backgroundColor: CyberArcade.surface,
    borderWidth: 1,
    borderColor: CyberArcade.border,
    ...Elevation.card,
  },

  fieldGroup: {
    marginBottom: Spacing.md,
  },

  fieldLabel: {
    color: CyberArcade.mutedText,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: Spacing.xs + 2,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm + 2,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: CyberArcade.surfaceInset,
    borderWidth: 1,
    borderColor: CyberArcade.border,
  },

  inputRowFocused: {
    borderColor: CyberArcade.magenta,
  },

  input: {
    flex: 1,
    height: '100%',
    color: CyberArcade.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },

  primaryButton: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: CyberArcade.magenta,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    overflow: 'hidden',
    marginTop: Spacing.xs,
    ...Elevation.glowMagenta,
  },

  primaryButtonSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },

  primaryButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.94,
  },

  primaryButtonDisabled: {
    opacity: 0.7,
  },

  primaryButtonText: {
    color: CyberArcade.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  linkRow: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.xs,
  },

  linkText: {
    color: CyberArcade.secondaryText,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },

  linkTextAccent: {
    color: CyberArcade.magenta,
    fontWeight: '800',
  },
});
