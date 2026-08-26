import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { MonthSwitcher } from '../components/MonthSwitcher';
import { ProgressBar } from '../components/ProgressBar';
import { CATEGORY_COLORS } from '../lib/categories';
import { formatDate, formatKes } from '../lib/format';
import { useAppData } from '../state/AppDataContext';
import { theme } from '../theme';

export function DashboardScreen() {
  const { month, setMonth, summary, categorySpend, budgets, transactions } = useAppData();
  const net = summary.moneyIn - summary.moneyOut - summary.fees;
  const topCategories = categorySpend.slice(0, 5);
  const maxSpend = topCategories[0]?.spent ?? 0;
  const budgetTotal = budgets.reduce((total, budget) => total + budget.amount, 0);
  const budgetedSpend = categorySpend
    .filter((entry) => budgets.some((budget) => budget.category === entry.category))
    .reduce((total, entry) => total + entry.spent, 0);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <MonthSwitcher month={month} onChange={setMonth} />

      <View style={styles.statRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Money in</Text>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {formatKes(summary.moneyIn)}
          </Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Money out</Text>
          <Text style={[styles.statValue, { color: theme.colors.danger }]}>
            {formatKes(summary.moneyOut)}
          </Text>
        </Card>
      </View>

      <Card>
        <Text style={styles.statLabel}>Net this month</Text>
        <Text style={[styles.netValue, { color: net >= 0 ? theme.colors.primary : theme.colors.danger }]}>
          {net < 0 ? '-' : ''}
          {formatKes(net)}
        </Text>
        <Text style={styles.muted}>
          {summary.transactionCount} transactions · {formatKes(summary.fees)} in M-Pesa fees
        </Text>
      </Card>

      <Card title="Budget usage">
        {budgetTotal === 0 ? (
          <Text style={styles.muted}>No budgets set for this month yet.</Text>
        ) : (
          <>
            <ProgressBar
              ratio={budgetedSpend / budgetTotal}
              color={budgetedSpend > budgetTotal ? theme.colors.danger : theme.colors.primary}
            />
            <Text style={[styles.muted, styles.spaced]}>
              {formatKes(budgetedSpend)} of {formatKes(budgetTotal)} budgeted spend used
            </Text>
          </>
        )}
      </Card>

      <Card title="Top spending categories">
        {topCategories.length === 0 ? (
          <Text style={styles.muted}>Import some M-Pesa messages to see your spending.</Text>
        ) : (
          topCategories.map((entry) => (
            <View key={entry.category} style={styles.barRow}>
              <View style={styles.barLabels}>
                <Text style={styles.barName}>{entry.category}</Text>
                <Text style={styles.barValue}>{formatKes(entry.spent)}</Text>
              </View>
              <ProgressBar
                ratio={maxSpend > 0 ? entry.spent / maxSpend : 0}
                color={CATEGORY_COLORS[entry.category] ?? theme.colors.primary}
              />
            </View>
          ))
        )}
      </Card>

      <Card title="Recent activity">
        {transactions.slice(0, 5).map((transaction) => (
          <View key={transaction.id} style={styles.recentRow}>
            <View style={styles.recentInfo}>
              <Text style={styles.recentName} numberOfLines={1}>
                {transaction.counterparty || transaction.kind}
              </Text>
              <Text style={styles.muted}>{formatDate(transaction.occurredAt)}</Text>
            </View>
            <Text
              style={[
                styles.recentAmount,
                { color: transaction.direction === 'in' ? theme.colors.primary : theme.colors.text },
              ]}>
              {transaction.direction === 'in' ? '+' : '-'}
              {formatKes(transaction.amount)}
            </Text>
          </View>
        ))}
        {transactions.length === 0 && <Text style={styles.muted}>Nothing recorded yet.</Text>}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: theme.spacing(2), paddingBottom: theme.spacing(4) },
  statRow: { flexDirection: 'row', gap: theme.spacing(1.5) },
  statCard: { flex: 1 },
  statLabel: { color: theme.colors.muted, fontSize: 13, marginBottom: 4 },
  statValue: { fontSize: 17, fontWeight: '700' },
  netValue: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  muted: { color: theme.colors.muted, fontSize: 13 },
  spaced: { marginTop: theme.spacing(1) },
  barRow: { marginBottom: theme.spacing(1.5) },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  barName: { color: theme.colors.text, fontWeight: '600' },
  barValue: { color: theme.colors.muted },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing(1),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  recentInfo: { flex: 1, marginRight: theme.spacing(1) },
  recentName: { fontWeight: '600', color: theme.colors.text },
  recentAmount: { fontWeight: '700' },
});
