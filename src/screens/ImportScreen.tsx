import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '../components/Card';
import { saveParsedTransactions } from '../db';
import { formatDateTime, formatKes } from '../lib/format';
import { parseMpesaSmsBatch } from '../lib/mpesaParser';
import { sampleMessages } from '../lib/sampleMessages';
import { useAppData } from '../state/AppDataContext';
import { theme } from '../theme';

export function ImportScreen() {
  const { refresh, month } = useAppData();
  const [text, setText] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const parsed = useMemo(() => parseMpesaSmsBatch(text), [text]);
  const unparsedCount = useMemo(() => {
    const lines = text.split('\n').filter((line) => /confirmed/i.test(line));
    return Math.max(0, lines.length - parsed.length);
  }, [parsed.length, text]);

  const save = async () => {
    if (parsed.length === 0) return;
    setSaving(true);
    try {
      const inserted = await saveParsedTransactions(parsed);
      const skipped = parsed.length - inserted;
      setStatus(`Saved ${inserted} transaction${inserted === 1 ? '' : 's'}${skipped > 0 ? `, skipped ${skipped} duplicate${skipped === 1 ? '' : 's'}` : ''}.`);
      setText('');
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card title="Import M-Pesa messages">
        <Text style={styles.hint}>
          Copy confirmation SMS from your M-Pesa inbox and paste them below — one or many at a time.
          Everything stays on this device.
        </Text>
        <TextInput
          style={styles.input}
          multiline
          placeholder="TFA1B2C3D4 Confirmed. Ksh1,500.00 sent to ..."
          placeholderTextColor={theme.colors.muted}
          value={text}
          onChangeText={(value) => {
            setText(value);
            setStatus(null);
          }}
        />
        <View style={styles.actions}>
          <Pressable style={[styles.button, styles.secondary]} onPress={() => setText(sampleMessages(month))}>
            <Text style={styles.secondaryText}>Load sample</Text>
          </Pressable>
          <Pressable
            style={[styles.button, parsed.length === 0 || saving ? styles.disabled : styles.primary]}
            disabled={parsed.length === 0 || saving}
            onPress={save}>
            <Text style={styles.primaryText}>
              {saving ? 'Saving…' : `Save ${parsed.length || ''} transaction${parsed.length === 1 ? '' : 's'}`.trim()}
            </Text>
          </Pressable>
        </View>
        {status && <Text style={styles.status}>{status}</Text>}
        {unparsedCount > 0 && (
          <Text style={styles.warning}>
            {unparsedCount} message{unparsedCount === 1 ? '' : 's'} could not be recognised and will be skipped.
          </Text>
        )}
      </Card>

      {parsed.length > 0 && (
        <Card title="Preview">
          {parsed.map((transaction, index) => (
            <View key={`${transaction.code}-${index}`} style={styles.previewRow}>
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>{transaction.counterparty || transaction.kind}</Text>
                <Text style={styles.hint}>
                  {transaction.kind} · {formatDateTime(transaction.occurredAt)}
                </Text>
              </View>
              <Text
                style={[
                  styles.previewAmount,
                  { color: transaction.direction === 'in' ? theme.colors.primary : theme.colors.text },
                ]}>
                {transaction.direction === 'in' ? '+' : '-'}
                {formatKes(transaction.amount)}
              </Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: theme.spacing(2), paddingBottom: theme.spacing(4) },
  hint: { color: theme.colors.muted, fontSize: 13, marginBottom: theme.spacing(1) },
  input: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing(1.5),
    textAlignVertical: 'top',
    color: theme.colors.text,
  },
  actions: { flexDirection: 'row', gap: theme.spacing(1), marginTop: theme.spacing(1.5) },
  button: {
    flex: 1,
    paddingVertical: theme.spacing(1.5),
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  primary: { backgroundColor: theme.colors.primary },
  disabled: { backgroundColor: '#c7d0dd' },
  secondary: { backgroundColor: theme.colors.chipBackground },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryText: { color: theme.colors.text, fontWeight: '600' },
  status: { color: theme.colors.primaryDark, marginTop: theme.spacing(1.5), fontWeight: '600' },
  warning: { color: theme.colors.warning, marginTop: theme.spacing(1) },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing(1),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  previewInfo: { flex: 1, marginRight: theme.spacing(1) },
  previewName: { fontWeight: '600', color: theme.colors.text },
  previewAmount: { fontWeight: '700' },
});
