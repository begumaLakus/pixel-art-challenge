import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/src/theme';

import { AppText } from './AppText';
import { StickerBox } from './StickerBox';
import { StickerButton } from './StickerButton';

export type AppAlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AppAlertButton {
  text?: string;
  style?: AppAlertButtonStyle;
  onPress?: () => void;
}

export interface AppAlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
}

interface AppAlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AppAlertButton[];
  cancelable: boolean;
  onDismiss?: () => void;
}

const DEFAULT_STATE: AppAlertState = {
  visible: false,
  title: '',
  message: undefined,
  buttons: [],
  cancelable: true,
  onDismiss: undefined,
};

/**
 * `Alert.alert` iOS'ta native, Android'de sade sistem diyaloğu gösterir ve
 * uygulamanın görsel diliyle uyuşmaz. AppAlert iki platformda da aynı
 * görünen, temaya uygun bir modal render eder.
 *
 * Kullanım `Alert.alert` ile aynı imzayı taklit eder:
 *
 *   AppAlert.alert('Başlık', 'Mesaj', [
 *     { text: 'Vazgeç', style: 'cancel' },
 *     { text: 'Sil', style: 'destructive', onPress: handleDelete },
 *   ]);
 *
 * Herhangi bir yerden çağrılabilmesi için uygulama kökünde (app/_layout.tsx)
 * bir kez `AppAlertHost` render edilir; ikisi minik bir pub/sub store
 * üzerinden haberleşir, ayrı bir Context gerekmez.
 */
let state: AppAlertState = DEFAULT_STATE;
let listeners: ((next: AppAlertState) => void)[] = [];

const notify = (): void => {
  listeners.forEach((listener) => listener(state));
};

const alert = (
  title: string,
  message?: string,
  buttons?: AppAlertButton[],
  options?: AppAlertOptions,
): void => {
  state = {
    visible: true,
    title,
    message,
    buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'Tamam' }],
    cancelable: options?.cancelable ?? true,
    onDismiss: options?.onDismiss,
  };

  notify();
};

const dismiss = (): void => {
  state = { ...state, visible: false };
  notify();
};

export const AppAlert = { alert };

const VARIANT_FOR_STYLE = {
  default: 'ink',
  cancel: 'white',
  destructive: 'pink',
} as const;

export const AppAlertHost = () => {
  const [local, setLocal] = useState<AppAlertState>(state);

  useEffect(() => {
    listeners.push(setLocal);

    return () => {
      listeners = listeners.filter((listener) => listener !== setLocal);
    };
  }, []);

  const handleDismiss = (): void => {
    if (!local.cancelable) {
      return;
    }

    dismiss();
    local.onDismiss?.();
  };

  const handleButtonPress = (button: AppAlertButton): void => {
    dismiss();
    button.onPress?.();
  };

  const stacked = local.buttons.length > 2;

  return (
    <Modal
      visible={local.visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <Pressable style={styles.backdrop} onPress={handleDismiss}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <StickerBox offset={5} contentStyle={styles.card}>
            <AppText variant="title">{local.title}</AppText>

            {local.message ? (
              <AppText variant="body" color={colors.muted}>
                {local.message}
              </AppText>
            ) : null}

            <View style={[styles.buttonRow, stacked && styles.buttonColumn]}>
              {local.buttons.map((button, index) => (
                <StickerButton
                  key={`${button.text ?? 'button'}-${index}`}
                  label={button.text ?? 'Tamam'}
                  variant={VARIANT_FOR_STYLE[button.style ?? 'default']}
                  style={stacked ? undefined : styles.buttonFlex}
                  onPress={() => handleButtonPress(button)}
                />
              ))}
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
  sheet: { width: '100%', maxWidth: 360 },
  card: { padding: spacing.lg, gap: spacing.sm },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  buttonColumn: { flexDirection: 'column-reverse' },
  buttonFlex: { flex: 1 },
});
