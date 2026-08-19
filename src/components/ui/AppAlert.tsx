import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { CyberArcade, Elevation, Radius, Spacing } from '@/constants/theme';

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
 * `Alert.alert` iOS'ta native, temaya uyumlu gözüken bir diyalog
 * gösterirken Android'de sade/varsayılan sistem diyaloğuna düşüyor — bu
 * da CyberArcade temasıyla uyumsuz, "ucuz" duruyordu. AppAlert bunun
 * yerine iki platformda da BİREBİR AYNI, temayla uyumlu (kart, renkler,
 * tipografi) özel bir modal render eder.
 *
 * Kullanım `Alert.alert` ile aynı imzayı taklit eder, böylece mevcut
 * çağrı yerleri sadece `Alert.alert(...)` -> `AppAlert.alert(...)`
 * olarak değişir; buton dizisi, `{ cancelable }` gibi seçenekler aynı
 * şekilde çalışır:
 *
 *   AppAlert.alert('Başlık', 'Mesaj', [
 *     { text: 'Vazgeç', style: 'cancel' },
 *     { text: 'Sil', style: 'destructive', onPress: handleDelete },
 *   ]);
 *
 * Herhangi bir ekrandan/bileşenden çağrılabilmesi için tek bir
 * `AppAlertHost` bileşeninin uygulama kökünde (app/_layout.tsx) bir kez
 * render edilmesi yeterli — aralarında minik bir pub/sub store üzerinden
 * haberleşiyorlar; ayrı bir Context/Provider sarmalamaya gerek yok.
 */
let state: AppAlertState = DEFAULT_STATE;
let listeners: Array<(next: AppAlertState) => void> = [];

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

const variantFor = (style: AppAlertButtonStyle | undefined) => {
  if (style === 'destructive') {
    return { container: styles.buttonDestructive, text: styles.buttonTextDestructive };
  }

  if (style === 'cancel') {
    return { container: styles.buttonCancel, text: styles.buttonTextCancel };
  }

  return { container: styles.buttonDefault, text: styles.buttonTextDefault };
};

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
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{local.title}</Text>

          {local.message ? (
            <Text style={styles.message}>{local.message}</Text>
          ) : null}

          <View style={[styles.buttonRow, stacked && styles.buttonColumn]}>
            {local.buttons.map((button, index) => {
              const variant = variantFor(button.style);

              return (
                <Pressable
                  key={`${button.text ?? 'button'}-${index}`}
                  accessibilityRole="button"
                  accessibilityLabel={button.text ?? 'Tamam'}
                  onPress={() => handleButtonPress(button)}
                  style={({ pressed }) => [
                    styles.button,
                    variant.container,
                    !stacked && styles.buttonFlex,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={[styles.buttonText, variant.text]}
                    numberOfLines={1}
                  >
                    {button.text ?? 'Tamam'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
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
    padding: Spacing.lg,
    backgroundColor: 'rgba(10, 7, 20, 0.72)',
  },

  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    backgroundColor: CyberArcade.surface,
    borderWidth: 1,
    borderColor: CyberArcade.border,
    ...Elevation.raised,
  },

  title: {
    color: CyberArcade.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.1,
  },

  message: {
    marginTop: Spacing.xs + 2,
    color: CyberArcade.secondaryText,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },

  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },

  buttonColumn: {
    flexDirection: 'column-reverse',
  },

  button: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
  },

  buttonFlex: {
    flex: 1,
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  buttonText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  buttonDefault: {
    backgroundColor: CyberArcade.magenta,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },

  buttonTextDefault: {
    color: CyberArcade.white,
  },

  buttonCancel: {
    backgroundColor: CyberArcade.surfaceInset,
    borderColor: CyberArcade.border,
  },

  buttonTextCancel: {
    color: CyberArcade.secondaryText,
  },

  buttonDestructive: {
    backgroundColor: 'rgba(255, 59, 107, 0.08)',
    borderColor: 'rgba(255, 59, 107, 0.4)',
  },

  buttonTextDestructive: {
    color: CyberArcade.danger,
  },
});
