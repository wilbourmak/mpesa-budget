import { StyleSheet, View } from 'react-native';

import { theme } from '../theme';

interface ProgressBarProps {
  ratio: number;
  color?: string;
}

export function ProgressBar({ ratio, color = theme.colors.primary }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.chipBackground,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4 },
});
