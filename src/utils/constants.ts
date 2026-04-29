export enum TransactionType {
  INCOME = 'gelir',
  EXPENSE = 'gider',
}

export const DB_NAME = 'harcamalarim.db';

export const PATTERNS = {
  TRANSACTION_REGEX: /(?:(\d{2}:\d{2})\s+)?#(gider|gelir)\s+(\d+(?:\.\d+)?)(?:\s+([^\n]*))?/gi,
};

export const UI_COLORS = {
  background: '#0f0f0fff',
  text: '#FFFFFF',
  textSecondary: '#888888',
  cardBackground: '#111111',
  border: '#222222',
  
  error: '#FF4B4B',
  success: '#00D68F',

  primary: '#03DAC6',
};

export const THEME_PALETTES = [
  { name: 'Paper', color: '#F2EBE3' },
  { name: 'Sand', color: '#EDD58F' },
  { name: 'Blood', color: '#880808' },
  { name: 'Teal', color: '#03DAC6' }
];
