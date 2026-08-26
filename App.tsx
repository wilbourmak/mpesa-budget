import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { BudgetsScreen } from './src/screens/BudgetsScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ImportScreen } from './src/screens/ImportScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { AppDataProvider } from './src/state/AppDataContext';
import { theme } from './src/theme';

const TABS = [
  { key: 'dashboard', label: 'Home', icon: '📊', screen: DashboardScreen },
  { key: 'transactions', label: 'Activity', icon: '🧾', screen: TransactionsScreen },
  { key: 'import', label: 'Import', icon: '📥', screen: ImportScreen },
  { key: 'budgets', label: 'Budgets', icon: '🎯', screen: BudgetsScreen },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function App() {
  const [tab, setTab] = useState<TabKey>('dashboard');
  const Screen = TABS.find((entry) => entry.key === tab)?.screen ?? DashboardScreen;

  return (
    <AppDataProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.brand}>M-Pesa Budget</Text>
          <Text style={styles.subtitle}>Track spending, stay on budget</Text>
        </View>
        <View style={styles.body}>
          <Screen />
        </View>
        <View style={styles.tabBar}>
          {TABS.map((entry) => (
            <Pressable
              key={entry.key}
              accessibilityRole="button"
              accessibilityState={{ selected: tab === entry.key }}
              style={styles.tab}
              onPress={() => setTab(entry.key)}>
              <Text style={styles.tabIcon}>{entry.icon}</Text>
              <Text style={[styles.tabLabel, tab === entry.key && styles.tabLabelActive]}>
                {entry.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </AppDataProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    paddingHorizontal: theme.spacing(2),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(1),
  },
  brand: { fontSize: 22, fontWeight: '800', color: theme.colors.text },
  subtitle: { color: theme.colors.muted, fontSize: 13 },
  body: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing(1),
  },
  tab: { flex: 1, alignItems: 'center' },
  tabIcon: { fontSize: 18 },
  tabLabel: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
  tabLabelActive: { color: theme.colors.primary, fontWeight: '700' },
});
