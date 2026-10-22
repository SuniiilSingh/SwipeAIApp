/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useAppTheme } from '@/context/theme-context';

export function useTheme() {
  const { colors } = useAppTheme();
  return colors;
}
