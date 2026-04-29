import { TransactionRecord } from '@/src/db/DB';
import { PATTERNS, TransactionType } from '@/src/utils/constants';

export const parseTransactions = (content: string): Omit<TransactionRecord, 'id' | 'note_id' | 'dateStr'>[] => {
  const transactions: Omit<TransactionRecord, 'id' | 'note_id' | 'dateStr'>[] = [];
  const matches = content.matchAll(PATTERNS.TRANSACTION_REGEX);

  for (const match of matches) {
    const [, time, type, amount, description] = match;
    transactions.push({
      time: time || undefined,
      type: type as TransactionType,
      amount: parseFloat(amount),
      description: (description || '').trim(),
    });
  }

  return transactions;
};
