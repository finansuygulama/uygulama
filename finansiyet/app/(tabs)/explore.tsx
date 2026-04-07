import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UI_COLORS, TransactionType } from '@/src/utils/constants';
import { getTransactionsByMonth, TransactionRecord } from '@/src/db/DB';

export default function SummaryScreen() {
  const [monthData, setMonthData] = useState<TransactionRecord[]>([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });

  const now = new Date();
  const monthStr = now.toISOString().slice(0, 7); // YYYY-MM
  const displayMonth = now.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

  const loadData = useCallback(() => {
    const txs = getTransactionsByMonth(monthStr);
    setMonthData(txs);

    let income = 0;
    let expense = 0;
    txs.forEach(t => {
      if (t.type === TransactionType.INCOME) income += t.amount;
      else expense += t.amount;
    });

    setSummary({
      income,
      expense,
      balance: income - expense
    });
  }, [monthStr]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">{displayMonth}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.cardContainer}>
        <ThemedView style={styles.balanceCard}>
          <ThemedText style={styles.cardLabel}>Net Bakiye</ThemedText>
          <ThemedText style={[styles.cardValue, summary.balance < 0 ? styles.expenseText : styles.incomeText]}>
            {summary.balance.toLocaleString('tr-TR')} ₺
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.statsRow}>
          <ThemedView style={[styles.statItem, styles.incomeCard]}>
            <ThemedText style={styles.statLabel}>Gelir</ThemedText>
            <ThemedText style={styles.statValue}>{summary.income} ₺</ThemedText>
          </ThemedView>
          <ThemedView style={[styles.statItem, styles.expenseCard]}>
            <ThemedText style={styles.statLabel}>Gider</ThemedText>
            <ThemedText style={styles.statValue}>{summary.expense} ₺</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      <ThemedText type="subtitle" style={styles.listHeader}>Son İşlemler</ThemedText>
      <FlatList
        data={monthData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ThemedView style={styles.txItem}>
            <ThemedView>
              <ThemedText style={styles.txDesc}>{item.description}</ThemedText>
              <ThemedText style={styles.txDate}>{item.dateStr}</ThemedText>
            </ThemedView>
            <ThemedText style={[styles.txAmount, item.type === 'gelir' ? styles.incomeText : styles.expenseText]}>
              {item.type === 'gelir' ? '+' : '-'} {item.amount} ₺
            </ThemedText>
          </ThemedView>
        )}
        ListEmptyComponent={<ThemedText style={styles.emptyText}>Henüz işlem yok.</ThemedText>}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: UI_COLORS.background,
  },
  header: {
    marginBottom: 20,
  },
  cardContainer: {
    marginBottom: 30,
  },
  balanceCard: {
    backgroundColor: '#1E1E1E',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardLabel: {
    color: '#AAA',
    fontSize: 14,
    marginBottom: 5,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  statItem: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  incomeCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  expenseCard: {
    backgroundColor: 'rgba(207, 102, 121, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(207, 102, 121, 0.3)',
  },
  statLabel: {
    color: '#AAA',
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    color: UI_COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  listHeader: {
    marginBottom: 15,
  },
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  txDesc: {
    color: UI_COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  txDate: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  incomeText: {
    color: UI_COLORS.success,
  },
  expenseText: {
    color: UI_COLORS.error,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});
