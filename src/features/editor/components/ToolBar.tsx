import * as Haptics from 'expo-haptics';
import React, { memo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/src/components/ui/Icon';
import { colors, radius, spacing, stroke } from '@/src/theme';

import type { EditorTool } from '../hooks/usePixelEditor';

interface ToolBarProps {
  tool: EditorTool;
  mirror: boolean;
  canUndo: boolean;
  canRedo: boolean;
  disabled?: boolean;
  onSelectTool: (tool: EditorTool) => void;
  onToggleMirror: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}

interface ToolButtonProps {
  icon: IconName;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

const ToolButton = ({
  icon,
  label,
  active = false,
  disabled = false,
  onPress,
}: ToolButtonProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ selected: active, disabled }}
    disabled={disabled}
    onPress={() => {
      if (Platform.OS !== 'web') {
        void Haptics.selectionAsync();
      }
      onPress();
    }}
    style={({ pressed }) => [
      styles.button,
      active && styles.buttonActive,
      disabled && styles.buttonDisabled,
      pressed && styles.buttonPressed,
    ]}
  >
    <Icon name={icon} size={22} />
  </Pressable>
);

const TOOLS: { tool: EditorTool; icon: IconName; label: string }[] = [
  { tool: 'paint', icon: 'pencil', label: 'Kalem' },
  { tool: 'erase', icon: 'eraser', label: 'Silgi' },
  { tool: 'fill', icon: 'format-color-fill', label: 'Kova' },
  { tool: 'pick', icon: 'eyedropper', label: 'Pipet' },
];

/** Çizim araçları, simetri, geri/ileri al ve temizle. */
export const ToolBar = memo(
  ({
    tool,
    mirror,
    canUndo,
    canRedo,
    disabled = false,
    onSelectTool,
    onToggleMirror,
    onUndo,
    onRedo,
    onClear,
  }: ToolBarProps) => (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {TOOLS.map((item) => (
          <ToolButton
            key={item.tool}
            icon={item.icon}
            label={item.label}
            active={tool === item.tool}
            disabled={disabled}
            onPress={() => onSelectTool(item.tool)}
          />
        ))}

        <ToolButton
          icon="flip-horizontal"
          label={mirror ? 'Simetri açık' : 'Simetri kapalı'}
          active={mirror}
          disabled={disabled}
          onPress={onToggleMirror}
        />
      </View>

      <View style={styles.row}>
        <ToolButton
          icon="undo"
          label="Geri al"
          disabled={disabled || !canUndo}
          onPress={onUndo}
        />
        <ToolButton
          icon="redo"
          label="İleri al"
          disabled={disabled || !canRedo}
          onPress={onRedo}
        />
        <ToolButton
          icon="delete-sweep-outline"
          label="Tümünü temizle"
          disabled={disabled}
          onPress={onClear}
        />
      </View>
    </View>
  ),
);

ToolBar.displayName = 'ToolBar';

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: stroke.base,
    borderColor: colors.ink,
    backgroundColor: colors.white,
  },
  buttonActive: { backgroundColor: colors.lime },
  buttonDisabled: { opacity: 0.35 },
  buttonPressed: { transform: [{ scale: 0.94 }] },
});
