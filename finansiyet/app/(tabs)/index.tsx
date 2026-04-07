import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UI_COLORS } from '@/src/utils/constants';
import { saveNote, getNoteByDate, TransactionRecord } from '@/src/db/DB';
import { parseTransactions } from '@/src/utils/parser';

export default function JournalScreen() {
  const [content, setContent] = useState('');
  const [transactions, setTransactions] = useState<Omit<TransactionRecord, 'id' | 'note_id' | 'dateStr'>[]>([]);
  
  // Format: YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadToday = () => {
      const existing = getNoteByDate(today);
      if (existing) {
        setContent(existing.content);
        setTransactions(parseTransactions(existing.content));
      }
    };
    loadToday();
  }, []);

  const handleTextChange = (text: string) => {
    setContent(text);
    // Real-time parsing for feedback
    setTransactions(parseTransactions(text));
  };

  const handleSave = () => {
    if (!content.trim()) {
      Alert.alert('Hata', 'Lütfen bir şeyler yazın.');
      return;
    }

    try {
      const parsed = parseTransactions(content);
      saveNote(content, today, parsed);
      Alert.alert('Başarılı', 'Günlük kaydedildi.');
    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'Kaydedilirken bir sorun oluştu.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Günlük ({today})</ThemedText>
      </ThemedView>

      <TextInput
        multiline
        placeholder="Bugün neler oldu? #gider 50 Kahve gibi notlar ekle..."
        placeholderTextColor="#666"
        style={styles.editor}
        value={content}
        onChangeText={handleTextChange}
        textAlignVertical="top"
      />

      <ThemedView style={styles.summaryContainer}>
        <ThemedText type="subtitle">Bugünkü İşlemler:</ThemedText>
        {transactions.length === 0 ? (
          <ThemedText style={styles.emptyText}>Henüz işlem algılanmadı.</ThemedText>
        ) : (
          transactions.map((tx, index) => (
            <ThemedView key={index} style={styles.txRow}>
              <ThemedText style={[styles.txType, tx.type === 'gelir' ? styles.income : styles.expense]}>
                {tx.type === 'gelir' ? '+' : '-'} {tx.amount} TL
              </ThemedText>
              <ThemedText style={styles.txDesc}>{tx.description}</ThemedText>
            </ThemedView>
          ))
        )}
      </ThemedView>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <ThemedText style={styles.saveButtonText}>Kaydet</ThemedText>
      </TouchableOpacity>
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
  editor: {
    flex: 1,
    color: UI_COLORS.text,
    fontSize: 18,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  summaryContainer: {
    maxHeight: 200,
    marginBottom: 20,
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  txType: {
    fontWeight: 'bold',
    fontSize: 16,
    width: 100,
  },
  txDesc: {
    flex: 1,
    color: UI_COLORS.text,
    fontSize: 16,
  },
  income: {
    color: UI_COLORS.success,
  },
  expense: {
    color: UI_COLORS.error,
  },
  saveButton: {
    backgroundColor: UI_COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
