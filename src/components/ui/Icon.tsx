import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';

import { colors } from '@/src/theme';

export type IconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export const Icon = ({ name, size = 20, color = colors.ink }: IconProps) => (
  <MaterialCommunityIcons name={name} size={size} color={color} />
);
