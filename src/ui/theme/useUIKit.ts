// Bridge the app's existing light/dark mode (ThemeProvider) to the new UIKit
// color scheme. App screens call `const c = useUIKit()` and pass it to the
// brutal components. (/uidocs keeps its own local light/dark toggle and passes
// `c` explicitly, so it's unaffected.)
import { useTheme } from "./ThemeProvider";
import { darkColors, lightColors, type UIColors } from "./uikit";

export function useUIKit(): UIColors {
  return useTheme().isDark ? darkColors : lightColors;
}
