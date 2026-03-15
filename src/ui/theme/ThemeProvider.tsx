import React, { createContext, useContext, useEffect, useState } from "react";
import { Text, TextInput, useColorScheme } from "react-native";
import {
  darkTheme,
  darkThemeElectricViolet,
  darkThemeSunsetCoral,
  darkThemeForestGlass,
  darkThemeCompassTeal,
  lightTheme,
  lightThemeElectricViolet,
  lightThemeSunsetCoral,
  lightThemeCompassTeal,
  lightThemeSagePaper,
  type ThemeTokens,
} from "./tokens";
import {
  getStoredThemeMode,
  setStoredThemeMode,
  type ThemeMode,
} from "./theme_storage";

type ThemeContextValue = {
  theme: ThemeTokens;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  mode: "system",
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await getStoredThemeMode();
      if (active && stored) setMode(stored);
    })();
    return () => {
      active = false;
    };
  }, []);

  const resolvedMode =
    mode === "system" ? (scheme === "dark" ? "dark" : "light") : mode;

  const themeMap: Record<string, ThemeTokens> = {
    light: lightTheme,
    dark: darkTheme,
    sagePaper: lightThemeSagePaper,
    forestGlass: darkThemeForestGlass,
    compassTeal: lightThemeCompassTeal,
    compassTealDark: darkThemeCompassTeal,
    sunsetCoral: lightThemeSunsetCoral,
    sunsetCoralDark: darkThemeSunsetCoral,
    electricViolet: lightThemeElectricViolet,
    electricVioletDark: darkThemeElectricViolet,
  };

  const theme = themeMap[resolvedMode] ?? lightTheme;

  const setModeAndStore = (next: ThemeMode) => {
    setMode(next);
    void setStoredThemeMode(next);
  };

  useEffect(() => {
    const baseTextStyle = { color: theme.colors.text };

    Text.defaultProps = Text.defaultProps ?? {};
    const prevTextStyle = Text.defaultProps.style ?? [];
    Text.defaultProps.style = Array.isArray(prevTextStyle)
      ? [...prevTextStyle, baseTextStyle]
      : [prevTextStyle, baseTextStyle];

    TextInput.defaultProps = TextInput.defaultProps ?? {};
    const prevInputStyle = TextInput.defaultProps.style ?? [];
    TextInput.defaultProps.style = Array.isArray(prevInputStyle)
      ? [...prevInputStyle, baseTextStyle]
      : [prevInputStyle, baseTextStyle];
    TextInput.defaultProps.placeholderTextColor = theme.colors.subtext;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode: setModeAndStore }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext).theme;
}

export function useThemeSettings() {
  const { mode, setMode } = useContext(ThemeContext);
  return { mode, setMode };
}
