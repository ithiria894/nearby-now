import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "app_theme";

export type ThemeMode =
  | "system"
  | "light"
  | "dark"
  | "sagePaper"
  | "forestGlass"
  | "compassTeal"
  | "compassTealDark"
  | "sunsetCoral"
  | "sunsetCoralDark"
  | "electricViolet"
  | "electricVioletDark";

export async function getStoredThemeMode(): Promise<ThemeMode | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    if (
      value === "system" ||
      value === "light" ||
      value === "dark" ||
      value === "sagePaper" ||
      value === "forestGlass" ||
      value === "compassTeal" ||
      value === "compassTealDark" ||
      value === "sunsetCoral" ||
      value === "sunsetCoralDark" ||
      value === "electricViolet" ||
      value === "electricVioletDark"
    ) {
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
