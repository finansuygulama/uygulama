export enum TransactionType {
  INCOME = 'gelir',
  EXPENSE = 'gider',
}

export const DB_NAME = 'finansiyet.db';

export const PATTERNS = {
  // Matches #gider [amount] [description] 
  // Example: #gider 150 Market alışverişi
  TRANSACTION_REGEX: /#(gider|gelir)\s+(\d+(?:\.\d+)?)\s+([^#\n]+)/gi,
};

export const UI_COLORS = {
  background: '#121212', // Obsidian-like dark background
  text: '#E0E0E0',
  primary: '#03DAC6',
  error: '#CF6679',
  success: '#4CAF50',
};
