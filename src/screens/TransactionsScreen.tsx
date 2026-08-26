import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MonthSwitcher } from '../components/MonthSwitcher';
import { deleteTransaction, TransactionRecord, updateTransactionCategory } from '../db';
import { CATEGORIES, CATEGORY_COLORS } from '../lib/categories';
import { formatDateTime, formatKes } from '../lib/format';
import { useAppData } from '../state/AppDataContext';
import { theme } from '../theme';

const ALL = 'All';

export function TransactionsScreen() {
  const { month, setMonth, transactions, refresh } = useAppData();
  const [filter, setFilter] = useState<string>(ALL);
  const [selected, setSelected] = useState<TransactionRecord | null>(null);

  const filters = useMemo(() => {
    const used = Array.from(new Set(transactions.map((transaction) => transaction.category)));
    return [ALL, ...used.sort()];
  }, [transactions]);

  const visible = useMemo(
    () => (filter === ALL ? transactions : transactions.filter((item) => item.category === filter)),
    [filter, transactions]
  );

  const changeCategory = async (category: string) => {
    if (!selected) return;
    await updateTransactionCategory(selected.id, category);
    setSelected(null);
    await refresh();
  };

  const confirmDelete = (transaction: TransactionRecord) => {
    Alert.alert('Delete transaction', `Remove ${transaction.counterparty || transaction.kind}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTransaction(transaction.id);
          await refresh();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MonthSwitcher month={month} onChange={setMonth} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {filters.map((name) => (
            <Pressable
              key={name}
              onPress={() => setFilter(name)}
              style={[styles.chip, filter === name && styles.chipActive]}>
              <Text style={[styles.chipText, filter === name && styles.chipTextActive]}>{name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No transactions for this month. Import M-Pesa messages first.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => setSelected(item)}
            onLongPress={() => confirmDelete(item)}>
            <View style={[styles.dot, { backgroundColor: CATEGORY_COLORS[item.category] ?? theme.colors.muted }]} />
            <View style={styles.rowInfo}>
              <Text style={styles.rowName} numberOfLines={1}>
                {item.counterparty || item.kind}
              </Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {item.category} · {formatDateTime(item.occurredAt)}
              </Text>
              {item.accountRef ? <Text style={styles.rowMeta}>Acc {item.accountRef}</Text> : null}
            </View>
            <View style={styles.rowAmounts}>
              <Text
                style={[
                  styles.rowAmount,
                  { color: item.direction === 'in' ? theme.colors.primary : theme.colors.text },
                ]}>
                {item.direction === 'in' ? '+' : '-'}
                {formatKes(item.amount)}
              </Text>
              {item.fee > 0 && <Text style={styles.rowMeta}>fee {formatKes(item.fee)}</Text>}
            </View>
          </Pressable>
        )}
      />

      <Modal visible={selected !== null} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSelected(null)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>Category for {selected?.counterparty || selected?.kind}</Text>
            <ScrollView style={styles.sheetList}>
              {CATEGORIES.map((category) => (
                <Pressable
                  key={category.name}
                  style={styles.sheetRow}
                  onPress={() => changeCategory(category.name)}>
                  <View style={[styles.dot, { backgroundColor: category.color }]} />
                  <Text style={styles.sheetRowText}>{category.name}</Text>
                  {selected?.category === category.name && <Text style={styles.check}>✓</Text>}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: theme.spacing(2), paddingTop: theme.spacing(2) },
  chips: { gap: theme.spacing(1), paddingBottom: theme.spacing(1.5) },
  chip: {
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(0.75),
    borderRadius: 999,
    backgroundColor: theme.colors.chipBackground,
  },
  chipActive: { backgroundColor: theme.colors.primary },
  chipText: { color: theme.colors.muted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  list: { paddingHorizontal: theme.spacing(2), paddingBottom: theme.spacing(4) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: theme.spacing(1.5) },
  rowInfo: { flex: 1 },
  rowName: { fontWeight: '700', color: theme.colors.text },
  rowMeta: { color: theme.colors.muted, fontSize: 12 },
  rowAmounts: { alignItems: 'flex-end' },
  rowAmount: { fontWeight: '700' },
  empty: { color: theme.colors.muted, textAlign: 'center', marginTop: theme.spacing(4) },
  backdrop: { flex: 1, backgroundColor: 'rgba(16,24,40,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    padding: theme.spacing(2),
    maxHeight: '70%',
  },
  sheetTitle: { fontWeight: '700', fontSize: 16, marginBottom: theme.spacing(1.5) },
  sheetList: { flexGrow: 0 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing(1.25) },
  sheetRowText: { flex: 1, color: theme.colors.text },
  check: { color: theme.colors.primary, fontWeight: '700' },
});
