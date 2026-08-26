import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '../components/Card';
import { MonthSwitcher } from '../components/MonthSwitcher';
import { ProgressBar } from '../components/ProgressBar';
import { copyBudgets, setBudget } from '../db';
import { CATEGORIES, CATEGORY_COLORS } from '../lib/categories';
import { formatKes, shiftMonth } from '../lib/format';
import { useAppData } from '../state/AppDataContext';
import { theme } from '../theme';

const BUDGETABLE = CATEGORIES.filter((category) => category.name !== 'Income');

export function BudgetsScreen() {
  const { month, setMonth, budgets, categorySpend, refresh } = useAppData();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const commit = async (category: string) => {
    const draft = drafts[category];
    if (draft === undefined) return;
    const amount = Number(draft.replace(/[^\d.]/g, ''));
    setDrafts((current) => {
      const { [category]: _removed, ...rest } = current;
      return rest;
    });
    await setBudget(month, category, Number.isFinite(amount) ? amount : 0);
    await refresh();
  };

  const copyPreviousMonth = async () => {
    await copyBudgets(shiftMonth(month, -1), month);
    await refresh();
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <MonthSwitcher month={month} onChange={setMonth} />

      <Card
        title="Monthly budgets"
        action={
          <Pressable onPress={copyPreviousMonth}>
            <Text style={styles.link}>Copy last month</Text>
          </Pressable>
        }>
        <Text style={styles.hint}>Set a limit per category. Spending includes M-Pesa fees.</Text>
      </Card>

      {BUDGETABLE.map((category) => {
        const limit = budgets.find((budget) => budget.category === category.name)?.amount ?? 0;
        const spent = categorySpend.find((entry) => entry.category === category.name)?.spent ?? 0;
        const over = limit > 0 && spent > limit;

        return (
          <Card key={category.name}>
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: CATEGORY_COLORS[category.name] }]} />
              <Text style={styles.name}>{category.name}</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.colors.muted}
                value={drafts[category.name] ?? (limit > 0 ? String(limit) : '')}
                onChangeText={(value) => setDrafts((current) => ({ ...current, [category.name]: value }))}
                onBlur={() => commit(category.name)}
                onSubmitEditing={() => commit(category.name)}
                returnKeyType="done"
              />
            </View>
            <ProgressBar
              ratio={limit > 0 ? spent / limit : 0}
              color={over ? theme.colors.danger : CATEGORY_COLORS[category.name]}
            />
            <Text style={[styles.hint, styles.spaced]}>
              {formatKes(spent)} spent
              {limit > 0
                ? ` of ${formatKes(limit)} · ${over ? `${formatKes(spent - limit)} over` : `${formatKes(limit - spent)} left`}`
                : ' · no limit set'}
            </Text>
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: theme.spacing(2), paddingBottom: theme.spacing(4) },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing(1.25) },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: theme.spacing(1) },
  name: { flex: 1, fontWeight: '700', color: theme.colors.text },
  input: {
    width: 110,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing(1),
    paddingVertical: theme.spacing(0.75),
    textAlign: 'right',
    color: theme.colors.text,
  },
  hint: { color: theme.colors.muted, fontSize: 13 },
  spaced: { marginTop: theme.spacing(1) },
  link: { color: theme.colors.primary, fontWeight: '600' },
});
