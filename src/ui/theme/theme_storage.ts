import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "app_theme";

export type ThemeMode = "system" | "light" | "dark";

export async function getStoredThemeMode(): Promise<ThemeMode | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    if (value === "system" || value === "light" || value === "dark") {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

export async function setStoredThemeMode(mode: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore storage errors
  }
}
