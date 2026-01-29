import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "app_lang";

export async function getStoredLanguage(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return value ?? null;
  } catch {
    return null;
  }
}

export async function setStoredLanguage(lang: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore storage errors
  }
}
