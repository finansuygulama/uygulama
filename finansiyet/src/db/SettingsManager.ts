import * as FileSystem from 'expo-file-system';

const SETTINGS_FILE = `${FileSystem.documentDirectory}settings.json`;

const DEFAULT_LABELS = ['market', 'yemek', 'fatura', 'kira', 'maas', 'eglence', 'ulasim', 'diger'];

export const saveThemeColor = async (color: string) => {
  const settings = await getSettings();
  settings.accentColor = color;
  await saveSettings(settings);
};

export const getThemeColor = async () => {
  const settings = await getSettings();
  return settings.accentColor || '#03DAC6';
};

export const saveLabels = async (labels: string[]) => {
  const settings = await getSettings();
  settings.labels = labels;
  await saveSettings(settings);
};

export const getLabels = async () => {
  const settings = await getSettings();
  return settings.labels || DEFAULT_LABELS;
};

const getSettings = async () => {
  try {
    const info = await FileSystem.getInfoAsync(SETTINGS_FILE);
    if (!info.exists) return {};
    const content = await FileSystem.readAsStringAsync(SETTINGS_FILE);
    return JSON.parse(content);
  } catch (e) {
    return {};
  }
};

const saveSettings = async (settings: any) => {
  try {
    await FileSystem.writeAsStringAsync(SETTINGS_FILE, JSON.stringify(settings));
  } catch (e) {
    console.error('Ayarlar kaydedilemedi:', e);
  }
};
