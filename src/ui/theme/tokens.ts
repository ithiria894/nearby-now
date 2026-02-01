export type ThemeTokens = {
  isDark: boolean;
  colors: {
    bg: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    title: string;
    text: string;
    subtext: string;
    primary: string;
    overlay: string;

    chipBg: string;
    chipBorder: string;

    createdBg: string;
    createdBorder: string;
    createdText: string;

    joinedBg: string;
    joinedBorder: string;
    joinedText: string;

    expiredBg: string;
    expiredBorder: string;
    expiredText: string;

    soonBg: string;
    soonBorder: string;
    soonText: string;

    mineBg: string;
    mineBorder: string;

    otherBg: string;
    otherBorder: string;

    systemText: string;
    systemBg: string;
    systemBorder: string;

    dangerText: string;
    dangerBg: string;
    dangerBorder: string;

    okText: string;
    okBg: string;
    okBorder: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    pill: number;
  };
  typography: {
    title: { fontSize: number; fontWeight: "700" | "800" | "900" };
    body: { fontSize: number; fontWeight: "500" | "600" | "700" };
    subtext: { fontSize: number; fontWeight: "500" | "600" };
  };
};

export const lightTheme: ThemeTokens = {
  isDark: false,
  colors: {
    bg: "#F7F2EA",
    surface: "#FFFFFF",
    surfaceAlt: "#F3F4F6",
    border: "#E5E7EB",
    title: "#111827",
    text: "#111827",
    subtext: "#6B7280",
    primary: "#111827",
    overlay: "rgba(0,0,0,0.28)",

    chipBg: "rgba(255,255,255,0.82)",
    chipBorder: "rgba(17,24,39,0.10)",

    createdBg: "rgba(219,234,254,0.92)",
    createdBorder: "rgba(191,219,254,0.90)",
    createdText: "#1D4ED8",

    joinedBg: "rgba(220,252,231,0.92)",
    joinedBorder: "rgba(187,247,208,0.90)",
    joinedText: "#166534",

    expiredBg: "rgba(254,226,226,0.94)",
    expiredBorder: "rgba(254,202,202,0.92)",
    expiredText: "#991B1B",

    soonBg: "rgba(254,243,199,0.94)",
    soonBorder: "rgba(253,230,138,0.92)",
    soonText: "#92400E",

    mineBg: "#DCFCE7",
    mineBorder: "#BBF7D0",

    otherBg: "#F3F4F6",
    otherBorder: "#E5E7EB",

    systemText: "#6B7280",
    systemBg: "#F3F4F6",
    systemBorder: "#E5E7EB",

    dangerText: "#991B1B",
    dangerBg: "#FEE2E2",
    dangerBorder: "#FECACA",

    okText: "#166534",
    okBg: "#DCFCE7",
    okBorder: "#BBF7D0",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    pill: 999,
  },
  typography: {
    title: { fontSize: 18, fontWeight: "800" },
    body: { fontSize: 14, fontWeight: "600" },
    subtext: { fontSize: 12, fontWeight: "500" },
  },
};

export const darkTheme: ThemeTokens = {
  isDark: true,
  colors: {
    bg: "#0D0B09",
    surface: "#15110E",
    surfaceAlt: "#1C1713",
    border: "#2A231D",
    title: "#F6F0E8",
    text: "#EEE6DD",
    subtext: "#B7ADA2",
    primary: "#F6F0E8",
    overlay: "rgba(0,0,0,0.66)",

    chipBg: "rgba(246,240,232,0.06)",
    chipBorder: "rgba(246,240,232,0.10)",

    createdBg: "rgba(129,167,255,0.14)",
    createdBorder: "rgba(129,167,255,0.26)",
    createdText: "#D7E4FF",

    joinedBg: "rgba(74,205,140,0.14)",
    joinedBorder: "rgba(74,205,140,0.26)",
    joinedText: "#C7F6DA",

    expiredBg: "rgba(255,107,107,0.16)",
    expiredBorder: "rgba(255,107,107,0.28)",
    expiredText: "#FFD6D6",

    soonBg: "rgba(255,187,92,0.16)",
    soonBorder: "rgba(255,187,92,0.28)",
    soonText: "#FFE6BE",

    mineBg: "rgba(74,205,140,0.12)",
    mineBorder: "rgba(74,205,140,0.22)",

    otherBg: "rgba(246,240,232,0.045)",
    otherBorder: "rgba(246,240,232,0.10)",

    systemText: "#D2C7BC",
    systemBg: "rgba(246,240,232,0.045)",
    systemBorder: "rgba(246,240,232,0.10)",

    dangerText: "#FFD6D6",
    dangerBg: "rgba(255,107,107,0.16)",
    dangerBorder: "rgba(255,107,107,0.28)",

    okText: "#C7F6DA",
    okBg: "rgba(74,205,140,0.14)",
    okBorder: "rgba(74,205,140,0.26)",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    pill: 999,
  },
  typography: {
    title: { fontSize: 18, fontWeight: "800" },
    body: { fontSize: 14, fontWeight: "600" },
    subtext: { fontSize: 12, fontWeight: "500" },
  },
};
