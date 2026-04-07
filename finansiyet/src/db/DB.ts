import * as SQLite from 'expo-sqlite';
import { DB_NAME, TransactionType } from '../utils/constants';

// Open or create the local database
// Expo SDK 50+ uses openDatabaseSync or openDatabaseAsync.
// SDK 54 uses openDatabaseSync.
const db = SQLite.openDatabaseSync(DB_NAME);

export interface TransactionRecord {
  id: number;
  note_id: number;
  type: TransactionType;
  amount: number;
  description: string;
  dateStr: string;
}

export interface NoteRecord {
  id: number;
  content: string;
  dateStr: string;
  created_at: string;
}

export const initDB = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      dateStr TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id INTEGER,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      dateStr TEXT NOT NULL,
      FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
    );
  `);
};

// Insert a note and its parsed transactions
export const saveNote = (content: string, dateStr: string, parsedTransactions: Omit<TransactionRecord, 'id' | 'note_id' | 'dateStr'>[]) => {
  let noteId: number | null = null;
  
  db.withTransactionSync(() => {
    // 1. Check if note for today exists, update or insert
    const existing = db.getFirstSync<{id: number}>('SELECT id FROM notes WHERE dateStr = ?', [dateStr]);
    
    if (existing) {
      noteId = existing.id;
      db.runSync('UPDATE notes SET content = ? WHERE id = ?', [content, noteId]);
      // Clear old transactions for this note so we can insert the updated ones
      db.runSync('DELETE FROM transactions WHERE note_id = ?', [noteId]);
    } else {
      const result = db.runSync('INSERT INTO notes (content, dateStr) VALUES (?, ?)', [content, dateStr]);
      noteId = result.lastInsertRowId;
    }

    // 2. Insert new parsed transactions
    if (parsedTransactions.length > 0 && noteId !== null) {
      const stmt = db.prepareSync('INSERT INTO transactions (note_id, type, amount, description, dateStr) VALUES (?, ?, ?, ?, ?)');
      for (const tx of parsedTransactions) {
        stmt.executeSync([noteId, tx.type, tx.amount, tx.description, dateStr]);
      }
      stmt.finalizeSync();
    }
  });
  
  return noteId;
};

export const getNoteByDate = (dateStr: string): NoteRecord | null => {
  return db.getFirstSync<NoteRecord>('SELECT * FROM notes WHERE dateStr = ?', [dateStr]);
};

export const getTransactionsByMonth = (monthStr: string): TransactionRecord[] => {
  // monthStr like '2026-04'
  return db.getAllSync<TransactionRecord>('SELECT * FROM transactions WHERE dateStr LIKE ? ORDER BY dateStr DESC', [`${monthStr}%`]);
};
