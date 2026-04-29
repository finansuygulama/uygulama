import * as FileSystem from 'expo-file-system';
import { TransactionType } from '../utils/constants';
import { parseTransactions } from '../utils/parser';

const documentDirectory = FileSystem.documentDirectory;
const NOTES_DIR = documentDirectory ? `${documentDirectory}notes/` : '';

export interface TransactionRecord {
  id?: number;
  note_id?: number; 
  type: TransactionType;
  amount: number;
  description: string;
  dateStr: string;
  time?: string;
}

export interface NoteRecord {
  id?: number;
  content: string;
  dateStr: string;
  created_at: string;
}

const ensureDir = async () => {
  const dirInfo = await FileSystem.getInfoAsync(NOTES_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(NOTES_DIR, { intermediates: true });
  }
};

export const initDB = async () => {
  await ensureDir();
  console.log('Notes directory initialized');
};

export const saveNote = async (content: string, dateStr: string) => {
  await ensureDir();
  const fileUri = `${NOTES_DIR}${dateStr}.md`;
  await FileSystem.writeAsStringAsync(fileUri, content);
  return dateStr;
};

export const appendNote = async (content: string, dateStr: string) => {
  const existing = await getNoteByDate(dateStr);
  const updatedContent = existing 
    ? `${existing.content}\n${content}` 
    : content;
  return await saveNote(updatedContent, dateStr);
};

export const getNoteByDate = async (dateStr: string): Promise<NoteRecord | null> => {
  try {
    const fileUri = `${NOTES_DIR}${dateStr}.md`;
    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists) return null;
    
    const content = await FileSystem.readAsStringAsync(fileUri);
    return {
      content,
      dateStr,
      created_at: info.modificationTime?.toString() || new Date().toISOString(),
    };
  } catch (e) {
    console.warn('getNoteByDate failed:', e);
    return null;
  }
};

export const getTransactionsByMonth = async (monthStr: string): Promise<TransactionRecord[]> => {
  try {
    await ensureDir();
    const files = await FileSystem.readDirectoryAsync(NOTES_DIR);
    const monthFiles = files.filter(f => f.startsWith(monthStr) && f.endsWith('.md'));
    
    const allTransactions: TransactionRecord[] = [];
    
    for (const fileName of monthFiles) {
      const dateStr = fileName.replace('.md', '');
      const content = await FileSystem.readAsStringAsync(`${NOTES_DIR}${fileName}`);
      const parsed = parseTransactions(content);
      
      for (const tx of parsed) {
        allTransactions.push({
          ...tx,
          dateStr
        });
      }
    }
    
    return allTransactions.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  } catch (e) {
    console.warn('getTransactionsByMonth failed:', e);
    return [];
  }
};

export const getAllTransactions = async (): Promise<TransactionRecord[]> => {
  try {
    await ensureDir();
    const files = await FileSystem.readDirectoryAsync(NOTES_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    const allTransactions: TransactionRecord[] = [];
    
    for (const fileName of mdFiles) {
      const dateStr = fileName.replace('.md', '');
      const content = await FileSystem.readAsStringAsync(`${NOTES_DIR}${fileName}`);
      const parsed = parseTransactions(content);
      
      for (const tx of parsed) {
        allTransactions.push({
          ...tx,
          dateStr
        });
      }
    }
    
    return allTransactions.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  } catch (e) {
    console.warn('getAllTransactions failed:', e);
    return [];
  }
};

export const clearAllData = async () => {
  try {
    await ensureDir();
    const files = await FileSystem.readDirectoryAsync(NOTES_DIR);
    for (const file of files) {
      if (file.endsWith('.md')) {
        await FileSystem.deleteAsync(`${NOTES_DIR}${file}`, { idempotent: true });
      }
    }
  } catch (e) {
    console.warn('clearAllData failed:', e);
  }
};
