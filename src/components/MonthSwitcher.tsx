import { Pressable, StyleSheet, Text, View } from 'react-native';

import { monthLabel, shiftMonth } from '../lib/format';
import { theme } from '../theme';

interface MonthSwitcherProps {
  month: string;
  onChange: (month: string) => void;
}

export function MonthSwitcher({ month, onChange }: MonthSwitcherProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel="Previous month"
        style={styles.button}
        onPress={() => onChange(shiftMonth(month, -1))}>
        <Text style={styles.buttonText}>‹</Text>
      </Pressable>
      <Text style={styles.label}>{monthLabel(month)}</Text>
      <Pressable
        accessibilityLabel="Next month"
        style={styles.button}
        onPress={() => onChange(shiftMonth(month, 1))}>
        <Text style={styles.buttonText}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(1.5),
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buttonText: { fontSize: 20, lineHeight: 22, color: theme.colors.text },
  label: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
});
