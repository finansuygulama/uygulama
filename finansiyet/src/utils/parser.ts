import { PATTERNS, TransactionType } from './constants';
import { TransactionRecord } from '../db/DB';

export const parseTransactions = (text: string): Omit<TransactionRecord, 'id' | 'note_id' | 'dateStr'>[] => {
  const transactions: Omit<TransactionRecord, 'id' | 'note_id' | 'dateStr'>[] = [];
  
  // RegExp.exec needs to be called in a loop if 'g' flag is set.
  // We reset lastIndex to easily reuse the module-level regex safely.
  PATTERNS.TRANSACTION_REGEX.lastIndex = 0;
  
  let match;
  while ((match = PATTERNS.TRANSACTION_REGEX.exec(text)) !== null) {
    const typeStr = match[1].toLowerCase();
    const amountStr = match[2];
    const descriptionStr = match[3].trim();
    
    // ensure the parsed type is strictly from our enum
    const type = typeStr === TransactionType.EXPENSE ? TransactionType.EXPENSE : TransactionType.INCOME;
    
    transactions.push({
      type,
      amount: parseFloat(amountStr),
      description: descriptionStr,
    });
  }
  
  return transactions;
};
