import { router } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/ui/AppText';
import { StickerBox } from '@/src/components/ui/StickerBox';
import { StickerButton } from '@/src/components/ui/StickerButton';
import { TextField } from '@/src/components/ui/TextField';
import { deleteAccount } from '@/src/features/auth/services/accountService';
import { getAuthErrorMessage } from '@/src/features/auth/utils/authErrors';
import { colors, spacing } from '@/src/theme';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Hesap silme onayı: şifre ister (yeniden doğrulama) ve neyin silineceğini
 * açıkça yazar. Silme geri alınamaz.
 */
export const DeleteAccountModal = ({ visible, onClose }: DeleteAccountModalProps) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = (): void => {
    if (loading) {
      return;
    }

    setPassword('');
    setError(null);
    onClose();
  };

  const confirm = async (): Promise<void> => {
    if (!password) {
      setError('Devam etmek için şifreni gir.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await deleteAccount(password);

      setPassword('');
      onClose();
      router.replace('/auth/login');
    } catch (deleteError) {
      console.error('Hesap silinemedi:', deleteError);

      const code =
        typeof deleteError === 'object' && deleteError !== null && 'code' in deleteError
          ? String((deleteError as { code: unknown }).code)
          : '';

      setError(
        code.startsWith('auth/')
          ? getAuthErrorMessage(deleteError)
          : 'Hesap silinemedi. Birazdan tekrar dene.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={close}
    >
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <StickerBox offset={5} contentStyle={styles.card}>
            <AppText variant="title">Hesabını sil</AppText>

            <AppText variant="body" color={colors.muted}>
              Hesabın, tüm çizimlerin, oyların ve rozetlerin kalıcı olarak silinecek. Bu işlem
              geri alınamaz.
            </AppText>

            <TextField
              label="Şifre"
              icon="lock-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="Şifreni gir"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              returnKeyType="go"
              onSubmitEditing={confirm}
              error={error}
            />

            <View style={styles.row}>
              <StickerButton
                label="Vazgeç"
                variant="white"
                style={styles.flex}
                disabled={loading}
                onPress={close}
              />
              <StickerButton
                label="Hesabı sil"
                variant="pink"
                style={styles.flex}
                loading={loading}
                onPress={confirm}
              />
            </View>
          </StickerBox>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(21, 21, 21, 0.55)',
  },
  sheet: { width: '100%', maxWidth: 400 },
  card: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
