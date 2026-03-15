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
    shadow: string;

    brand: string;
    brandSoft: string;
    brandBorder: string;
    brandSurface: string;
    brandSurfaceAlt: string;
    brandSurfacePressed: string;
    ink: string;
    inkSubtle: string;
    inputBg: string;
    tabBorder: string;
    inactive: string;
    pageTitle: string;
    settingsText: string;
    settingsSubtext: string;
    settingsActionText: string;
    subtitleText: string;
    tabBarTextActive: string;
    tabBarTextInactive: string;
    segmentedTabTextActive: string;
    segmentedTabTextInactive: string;
    activityCardBorder: string;
    activityCardDivider: string;
    activityCardBg: string;
    composerBg: string;
    composerBorder: string;

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
  components: {
    activityCard: {
      borderWidth: number;
      radius: number;
      padding: number;
      gap: number;
      iconSize: number;
      iconRadius: number;
      timeTop: number;
      timeRight: number;
      contentRightPadding: number;
      dividerHeight: number;
      dividerOpacity: number;
      shadowOpacityMin: number;
      shadowOpacityMax: number;
      shadowRadiusMin: number;
      shadowRadiusMax: number;
      elevationMin: number;
      elevationMax: number;
    };
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
    shadow: "#000000",

    brand: "#5E8C55",
    brandSoft: "#E6F1DE",
    brandBorder: "#D6E6C8",
    brandSurface: "#F6F9F2",
    brandSurfaceAlt: "#EAF4E2",
    brandSurfacePressed: "#E2F0D8",
    ink: "#2E2A25",
    inkSubtle: "#3A342E",
    inputBg: "#F1ECE3",
    tabBorder: "#E7DFD2",
    inactive: "#9C9388",
    pageTitle: "#5E8C55",
    settingsText: "#2E2A25",
    settingsSubtext: "#3A342E",
    settingsActionText: "#2E2A25",
    subtitleText: "#3A342E",
    tabBarTextActive: "#5E8C55",
    tabBarTextInactive: "#9C9388",
    segmentedTabTextActive: "#2E2A25",
    segmentedTabTextInactive: "#9C9388",
    activityCardBorder: "#D6E6C8",
    activityCardDivider: "#D6E6C8",
    activityCardBg: "#F6F9F2",
    composerBg: "#EEF5ED",
    composerBorder: "#C8DCC0",

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
  components: {
    activityCard: {
      borderWidth: 1,
      radius: 16,
      padding: 14,
      gap: 8,
      iconSize: 40,
      iconRadius: 20,
      timeTop: 10,
      timeRight: 12,
      contentRightPadding: 36,
      dividerHeight: 1,
      dividerOpacity: 0.6,
      shadowOpacityMin: 0.1,
      shadowOpacityMax: 0.18,
      shadowRadiusMin: 12,
      shadowRadiusMax: 16,
      elevationMin: 2,
      elevationMax: 5,
    },
  },
};

export const darkTheme: ThemeTokens = {
  isDark: true,
  colors: {
    bg: "#040806",
    surface: "#070D0A",
    surfaceAlt: "#0A120E",
    border: "#14231B",

    title: "#E7EEE9",
    text: "#C8D6CE",
    subtext: "#85978E",
    primary: "#E7EEE9",

    overlay: "rgba(0,0,0,0.78)",
    shadow: "#000000",

    brand: "#1E5A44",
    brandSoft: "rgba(30,90,68,0.16)",
    brandBorder: "#163A2C",
    brandSurface: "#06110C",
    brandSurfaceAlt: "#081712",
    brandSurfacePressed: "#0B241A",

    ink: "#E7EEE9",
    inkSubtle: "#A3B4AC",

    inputBg: "#06110C",
    tabBorder: "#14231B",
    inactive: "#6A7C73",

    pageTitle: "#4C9A78",

    settingsText: "#C8D6CE",
    settingsSubtext: "#85978E",
    settingsActionText: "#E7EEE9",
    subtitleText: "#85978E",

    tabBarTextActive: "#E7EEE9",
    tabBarTextInactive: "#6A7C73",
    segmentedTabTextActive: "#E7EEE9",
    segmentedTabTextInactive: "#6A7C73",
    activityCardBorder: "#1C3328",
    activityCardDivider: "#25463A",
    activityCardBg: "#08130E",
    composerBg: "#060F0B",
    composerBorder: "#25463A",

    chipBg: "rgba(7,13,10,0.78)",
    chipBorder: "rgba(30,90,68,0.28)",

    createdBg: "rgba(37,99,235,0.14)",
    createdBorder: "rgba(37,99,235,0.28)",
    createdText: "#C7D2FE",

    joinedBg: "rgba(30,90,68,0.18)",
    joinedBorder: "rgba(30,90,68,0.34)",
    joinedText: "#BDEBD4",

    expiredBg: "rgba(220,38,38,0.14)",
    expiredBorder: "rgba(220,38,38,0.28)",
    expiredText: "#FECACA",

    soonBg: "rgba(217,119,6,0.14)",
    soonBorder: "rgba(217,119,6,0.28)",
    soonText: "#FDE68A",

    mineBg: "rgba(30,90,68,0.14)",
    mineBorder: "rgba(30,90,68,0.28)",

    otherBg: "rgba(148,163,184,0.07)",
    otherBorder: "rgba(148,163,184,0.16)",

    systemText: "#85978E",
    systemBg: "rgba(30,90,68,0.07)",
    systemBorder: "rgba(30,90,68,0.16)",

    dangerText: "#FECACA",
    dangerBg: "rgba(220,38,38,0.14)",
    dangerBorder: "rgba(220,38,38,0.28)",

    okText: "#BDEBD4",
    okBg: "rgba(30,90,68,0.18)",
    okBorder: "rgba(30,90,68,0.34)",
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
  components: {
    activityCard: {
      borderWidth: 1,
      radius: 16,
      padding: 14,
      gap: 8,
      iconSize: 40,
      iconRadius: 20,
      timeTop: 10,
      timeRight: 12,
      contentRightPadding: 36,
      dividerHeight: 1,
      dividerOpacity: 0.82,
      shadowOpacityMin: 0.1,
      shadowOpacityMax: 0.18,
      shadowRadiusMin: 12,
      shadowRadiusMax: 16,
      elevationMin: 2,
      elevationMax: 5,
    },
  },
};

// =======================
// New Themes (Named)
// =======================

export const lightThemeSagePaper: ThemeTokens = {
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
    shadow: "#000000",

    brand: "#4E7F63",
    brandSoft: "#E3EFE6",
    brandBorder: "#CFE2D6",
    brandSurface: "#F4F8F5",
    brandSurfaceAlt: "#EAF2EC",
    brandSurfacePressed: "#DFECE3",

    ink: "#2E2A25",
    inkSubtle: "#3A342E",
    inputBg: "#F1ECE3",
    tabBorder: "#E7DFD2",
    inactive: "#9C9388",
    pageTitle: "#4E7F63",
    settingsText: "#2E2A25",
    settingsSubtext: "#3A342E",
    settingsActionText: "#2E2A25",
    subtitleText: "#3A342E",

    tabBarTextActive: "#4E7F63",
    tabBarTextInactive: "#9C9388",
    segmentedTabTextActive: "#2E2A25",
    segmentedTabTextInactive: "#9C9388",

    activityCardBorder: "#CFE2D6",
    activityCardDivider: "#CFE2D6",
    activityCardBg: "#F4F8F5",
    composerBg: "#EAF2EC",
    composerBorder: "#C3D8CB",

    chipBg: "rgba(255,255,255,0.86)",
    chipBorder: "rgba(17,24,39,0.08)",

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
  components: {
    activityCard: {
      borderWidth: 1,
      radius: 16,
      padding: 14,
      gap: 8,
      iconSize: 40,
      iconRadius: 20,
      timeTop: 10,
      timeRight: 12,
      contentRightPadding: 36,
      dividerHeight: 1,
      dividerOpacity: 0.6,
      shadowOpacityMin: 0.1,
      shadowOpacityMax: 0.18,
      shadowRadiusMin: 12,
      shadowRadiusMax: 16,
      elevationMin: 2,
      elevationMax: 5,
    },
  },
};

export const darkThemeForestGlass: ThemeTokens = {
  isDark: true,
  colors: {
    bg: "#040806",
    surface: "#070D0A",
    surfaceAlt: "#0B1611",
    border: "#163228",

    title: "#E7EEE9",
    text: "#C8D6CE",
    subtext: "#85978E",
    primary: "#E7EEE9",

    overlay: "rgba(0,0,0,0.78)",
    shadow: "#000000",

    brand: "#4C9A78",
    brandSoft: "rgba(76,154,120,0.14)",
    brandBorder: "#1F3E32",
    brandSurface: "#06110C",
    brandSurfaceAlt: "rgba(76,154,120,0.10)",
    brandSurfacePressed: "rgba(76,154,120,0.18)",

    ink: "#E7EEE9",
    inkSubtle: "#A3B4AC",

    inputBg: "#06110C",
    tabBorder: "#163228",
    inactive: "#6A7C73",

    pageTitle: "#4C9A78",

    settingsText: "#C8D6CE",
    settingsSubtext: "#85978E",
    settingsActionText: "#E7EEE9",
    subtitleText: "#85978E",

    tabBarTextActive: "#BDEBD4",
    tabBarTextInactive: "#6A7C73",
    segmentedTabTextActive: "#E7EEE9",
    segmentedTabTextInactive: "#6A7C73",

    activityCardBorder: "#1F3E32",
    activityCardDivider: "rgba(76,154,120,0.28)",
    activityCardBg: "#0B1A14",
    composerBg: "#070F0B",
    composerBorder: "#1F3E32",

    chipBg: "rgba(11,26,20,0.72)",
    chipBorder: "rgba(76,154,120,0.30)",

    createdBg: "rgba(37,99,235,0.14)",
    createdBorder: "rgba(37,99,235,0.28)",
    createdText: "#C7D2FE",

    joinedBg: "rgba(76,154,120,0.16)",
    joinedBorder: "rgba(76,154,120,0.34)",
    joinedText: "#BDEBD4",

    expiredBg: "rgba(220,38,38,0.14)",
    expiredBorder: "rgba(220,38,38,0.28)",
    expiredText: "#FECACA",

    soonBg: "rgba(217,119,6,0.14)",
    soonBorder: "rgba(217,119,6,0.28)",
    soonText: "#FDE68A",

    mineBg: "rgba(76,154,120,0.14)",
    mineBorder: "rgba(76,154,120,0.28)",

    otherBg: "rgba(148,163,184,0.07)",
    otherBorder: "rgba(148,163,184,0.16)",

    systemText: "#85978E",
    systemBg: "rgba(76,154,120,0.07)",
    systemBorder: "rgba(76,154,120,0.16)",

    dangerText: "#FECACA",
    dangerBg: "rgba(220,38,38,0.14)",
    dangerBorder: "rgba(220,38,38,0.28)",

    okText: "#BDEBD4",
    okBg: "rgba(76,154,120,0.16)",
    okBorder: "rgba(76,154,120,0.34)",
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
  components: {
    activityCard: {
      borderWidth: 1,
      radius: 16,
      padding: 14,
      gap: 8,
      iconSize: 40,
      iconRadius: 20,
      timeTop: 10,
      timeRight: 12,
      contentRightPadding: 36,
      dividerHeight: 1,
      dividerOpacity: 0.82,
      shadowOpacityMin: 0.1,
      shadowOpacityMax: 0.18,
      shadowRadiusMin: 12,
      shadowRadiusMax: 16,
      elevationMin: 2,
      elevationMax: 5,
    },
  },
};

export const lightThemeCompassTeal: ThemeTokens = {
  isDark: false,
  colors: {
    bg: "#F6F0E6",
    surface: "#FFFFFF",
    surfaceAlt: "#F3F4F6",
    border: "#E7E0D6",
    title: "#141A17",
    text: "#141A17",
    subtext: "#5F6B66",
    primary: "#141A17",
    overlay: "rgba(0,0,0,0.28)",
    shadow: "#000000",

    brand: "#2FA78F",
    brandSoft: "rgba(47,167,143,0.14)",
    brandBorder: "rgba(47,167,143,0.26)",
    brandSurface: "#F3FBF8",
    brandSurfaceAlt: "rgba(47,167,143,0.10)",
    brandSurfacePressed: "rgba(47,167,143,0.18)",

    ink: "#2E2A25",
    inkSubtle: "#3A342E",
    inputBg: "#EFE7DA",
    tabBorder: "#E7E0D6",
    inactive: "#8A938E",

    pageTitle: "#1E7E6D",
    settingsText: "#2E2A25",
    settingsSubtext: "#3A342E",
    settingsActionText: "#141A17",
    subtitleText: "#3A342E",

    tabBarTextActive: "#1E7E6D",
    tabBarTextInactive: "#8A938E",
    segmentedTabTextActive: "#141A17",
    segmentedTabTextInactive: "#8A938E",

    activityCardBorder: "rgba(47,167,143,0.22)",
    activityCardDivider: "rgba(47,167,143,0.22)",
    activityCardBg: "#F3FBF8",
    composerBg: "#EAF6F1",
    composerBorder: "rgba(47,167,143,0.28)",

    chipBg: "rgba(255,255,255,0.88)",
    chipBorder: "rgba(20,26,23,0.08)",

    createdBg: "rgba(219,234,254,0.92)",
    createdBorder: "rgba(191,219,254,0.90)",
    createdText: "#1D4ED8",

    joinedBg: "rgba(209,250,229,0.92)",
    joinedBorder: "rgba(167,243,208,0.90)",
    joinedText: "#065F46",

    expiredBg: "rgba(254,226,226,0.94)",
    expiredBorder: "rgba(254,202,202,0.92)",
    expiredText: "#991B1B",

    soonBg: "rgba(254,243,199,0.94)",
    soonBorder: "rgba(253,230,138,0.92)",
    soonText: "#92400E",

    mineBg: "rgba(47,167,143,0.12)",
    mineBorder: "rgba(47,167,143,0.24)",

    otherBg: "#F3F4F6",
    otherBorder: "#E5E7EB",

    systemText: "#5F6B66",
    systemBg: "rgba(47,167,143,0.06)",
    systemBorder: "rgba(47,167,143,0.16)",

    dangerText: "#991B1B",
    dangerBg: "#FEE2E2",
    dangerBorder: "#FECACA",

    okText: "#065F46",
    okBg: "rgba(47,167,143,0.12)",
    okBorder: "rgba(47,167,143,0.24)",
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
  components: {
    activityCard: {
      borderWidth: 1,
      radius: 16,
      padding: 14,
      gap: 8,
      iconSize: 40,
      iconRadius: 20,
      timeTop: 10,
      timeRight: 12,
      contentRightPadding: 36,
      dividerHeight: 1,
      dividerOpacity: 0.6,
      shadowOpacityMin: 0.12,
      shadowOpacityMax: 0.2,
      shadowRadiusMin: 12,
      shadowRadiusMax: 18,
      elevationMin: 2,
      elevationMax: 6,
    },
  },
};

export const darkThemeCompassTeal: ThemeTokens = {
  isDark: true,
  colors: {
    bg: "#050908",
    surface: "#070F0D",
    surfaceAlt: "#0B1713",
    border: "#163028",

    title: "#E9F2EE",
    text: "#C9DAD3",
    subtext: "#7E978E",
    primary: "#E9F2EE",

    overlay: "rgba(0,0,0,0.78)",
    shadow: "#000000",

    brand: "#6FE7D1",
    brandSoft: "rgba(111,231,209,0.12)",
    brandBorder: "rgba(111,231,209,0.20)",
    brandSurface: "#06110E",
    brandSurfaceAlt: "rgba(47,167,143,0.10)",
    brandSurfacePressed: "rgba(111,231,209,0.18)",

    ink: "#E9F2EE",
    inkSubtle: "#A7BBB3",

    inputBg: "#06110E",
    tabBorder: "#163028",
    inactive: "#6A7C73",

    pageTitle: "#6FE7D1",

    settingsText: "#C9DAD3",
    settingsSubtext: "#7E978E",
    settingsActionText: "#E9F2EE",
    subtitleText: "#7E978E",

    tabBarTextActive: "#6FE7D1",
    tabBarTextInactive: "#6A7C73",
    segmentedTabTextActive: "#E9F2EE",
    segmentedTabTextInactive: "#6A7C73",

    activityCardBorder: "rgba(111,231,209,0.18)",
    activityCardDivider: "rgba(111,231,209,0.16)",
    activityCardBg: "#0B1A16",
    composerBg: "#081411",
    composerBorder: "rgba(111,231,209,0.26)",

    chipBg: "rgba(11,26,22,0.72)",
    chipBorder: "rgba(111,231,209,0.22)",

    createdBg: "rgba(37,99,235,0.14)",
    createdBorder: "rgba(37,99,235,0.28)",
    createdText: "#C7D2FE",

    joinedBg: "rgba(111,231,209,0.12)",
    joinedBorder: "rgba(111,231,209,0.24)",
    joinedText: "#BDF6EA",

    expiredBg: "rgba(220,38,38,0.14)",
    expiredBorder: "rgba(220,38,38,0.28)",
    expiredText: "#FECACA",

    soonBg: "rgba(217,119,6,0.14)",
    soonBorder: "rgba(217,119,6,0.28)",
    soonText: "#FDE68A",

    mineBg: "rgba(111,231,209,0.10)",
    mineBorder: "rgba(111,231,209,0.20)",

    otherBg: "rgba(148,163,184,0.07)",
    otherBorder: "rgba(148,163,184,0.16)",

    systemText: "#7E978E",
    systemBg: "rgba(111,231,209,0.06)",
    systemBorder: "rgba(111,231,209,0.14)",

    dangerText: "#FECACA",
    dangerBg: "rgba(220,38,38,0.14)",
    dangerBorder: "rgba(220,38,38,0.28)",

    okText: "#BDF6EA",
    okBg: "rgba(111,231,209,0.12)",
    okBorder: "rgba(111,231,209,0.24)",
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
  components: {
    activityCard: {
      borderWidth: 1,
      radius: 16,
      padding: 14,
      gap: 8,
      iconSize: 40,
      iconRadius: 20,
      timeTop: 10,
      timeRight: 12,
      contentRightPadding: 36,
      dividerHeight: 1,
      dividerOpacity: 0.86,
      shadowOpacityMin: 0.12,
      shadowOpacityMax: 0.2,
      shadowRadiusMin: 12,
      shadowRadiusMax: 18,
      elevationMin: 2,
      elevationMax: 6,
    },
  },
};

export const lightThemeSunsetCoral: ThemeTokens = {
  isDark: false,
  colors: {
    bg: "#FBF1EC",
    surface: "#FFFFFF",
    surfaceAlt: "#F6F7F8",
    border: "#E8DED8",

    title: "#1B1412",
    text: "#1B1412",
    subtext: "#6E5E58",
    primary: "#1B1412",

    overlay: "rgba(0,0,0,0.28)",
    shadow: "#000000",

    brand: "#E85D4F",
    brandSoft: "rgba(232,93,79,0.14)",
    brandBorder: "rgba(232,93,79,0.28)",
    brandSurface: "#FFF4F1",
    brandSurfaceAlt: "rgba(232,93,79,0.10)",
    brandSurfacePressed: "rgba(232,93,79,0.20)",

    ink: "#2A201D",
    inkSubtle: "#4A3A34",
    inputBg: "#F3E7E2",
    tabBorder: "#E8DED8",
    inactive: "#9B8B84",

    pageTitle: "#C44337",

    settingsText: "#2A201D",
    settingsSubtext: "#4A3A34",
    settingsActionText: "#1B1412",
    subtitleText: "#4A3A34",

    tabBarTextActive: "#E85D4F",
    tabBarTextInactive: "#9B8B84",
    segmentedTabTextActive: "#1B1412",
    segmentedTabTextInactive: "#9B8B84",

    activityCardBorder: "rgba(232,93,79,0.22)",
    activityCardDivider: "rgba(232,93,79,0.20)",
    activityCardBg: "#FFF4F1",
    composerBg: "#FBE5DE",
    composerBorder: "rgba(232,93,79,0.30)",

    chipBg: "rgba(255,255,255,0.9)",
    chipBorder: "rgba(27,20,18,0.08)",

    createdBg: "rgba(254,215,170,0.92)",
    createdBorder: "rgba(253,186,116,0.9)",
    createdText: "#9A3412",

    joinedBg: "rgba(220,252,231,0.92)",
    joinedBorder: "rgba(187,247,208,0.9)",
    joinedText: "#166534",

    expiredBg: "rgba(254,226,226,0.94)",
    expiredBorder: "rgba(254,202,202,0.92)",
    expiredText: "#991B1B",

    soonBg: "rgba(254,243,199,0.94)",
    soonBorder: "rgba(253,230,138,0.92)",
    soonText: "#92400E",

    mineBg: "rgba(232,93,79,0.12)",
    mineBorder: "rgba(232,93,79,0.26)",

    otherBg: "#F6F7F8",
    otherBorder: "#E5E7EB",

    systemText: "#6E5E58",
    systemBg: "rgba(232,93,79,0.06)",
    systemBorder: "rgba(232,93,79,0.16)",

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
  components: {
    activityCard: {
      borderWidth: 1,
      radius: 16,
      padding: 14,
      gap: 8,
      iconSize: 40,
      iconRadius: 20,
      timeTop: 10,
      timeRight: 12,
      contentRightPadding: 36,
      dividerHeight: 1,
      dividerOpacity: 0.6,
      shadowOpacityMin: 0.14,
      shadowOpacityMax: 0.22,
      shadowRadiusMin: 12,
      shadowRadiusMax: 18,
      elevationMin: 2,
      elevationMax: 6,
    },
  },
};

export const darkThemeSunsetCoral: ThemeTokens = {
  isDark: true,
  colors: {
    bg: "#0B0706",
    surface: "#120908",
    surfaceAlt: "#1A0F0D",
    border: "#2A1916",

    title: "#F6EDEA",
    text: "#E4D1CB",
    subtext: "#9C7F76",
    primary: "#F6EDEA",

    overlay: "rgba(0,0,0,0.78)",
    shadow: "#000000",

    brand: "#FF8A7A",
    brandSoft: "rgba(255,138,122,0.14)",
    brandBorder: "rgba(255,138,122,0.24)",
    brandSurface: "#140A09",
    brandSurfaceAlt: "rgba(232,93,79,0.12)",
    brandSurfacePressed: "rgba(255,138,122,0.22)",

    ink: "#F6EDEA",
    inkSubtle: "#CBB2AA",

    inputBg: "#140A09",
    tabBorder: "#2A1916",
    inactive: "#8C6F66",

    pageTitle: "#FF8A7A",

    settingsText: "#E4D1CB",
    settingsSubtext: "#9C7F76",
    settingsActionText: "#F6EDEA",
    subtitleText: "#9C7F76",

    tabBarTextActive: "#FF8A7A",
    tabBarTextInactive: "#8C6F66",
    segmentedTabTextActive: "#F6EDEA",
    segmentedTabTextInactive: "#8C6F66",

    activityCardBorder: "rgba(255,138,122,0.22)",
    activityCardDivider: "rgba(255,138,122,0.18)",
    activityCardBg: "#1A0F0D",
    composerBg: "#140A09",
    composerBorder: "rgba(255,138,122,0.26)",

    chipBg: "rgba(26,15,13,0.72)",
    chipBorder: "rgba(255,138,122,0.24)",

    createdBg: "rgba(37,99,235,0.14)",
    createdBorder: "rgba(37,99,235,0.28)",
    createdText: "#C7D2FE",

    joinedBg: "rgba(220,252,231,0.12)",
    joinedBorder: "rgba(187,247,208,0.24)",
    joinedText: "#BDEBD4",

    expiredBg: "rgba(220,38,38,0.14)",
    expiredBorder: "rgba(220,38,38,0.28)",
    expiredText: "#FECACA",

    soonBg: "rgba(217,119,6,0.14)",
    soonBorder: "rgba(217,119,6,0.28)",
    soonText: "#FDE68A",

    mineBg: "rgba(255,138,122,0.10)",
    mineBorder: "rgba(255,138,122,0.22)",

    otherBg: "rgba(148,163,184,0.07)",
    otherBorder: "rgba(148,163,184,0.16)",

    systemText: "#9C7F76",
    systemBg: "rgba(255,138,122,0.06)",
    systemBorder: "rgba(255,138,122,0.14)",

    dangerText: "#FECACA",
    dangerBg: "rgba(220,38,38,0.14)",
    dangerBorder: "rgba(220,38,38,0.28)",

    okText: "#B7F7D1",
    okBg: "rgba(34,197,94,0.16)",
    okBorder: "rgba(34,197,94,0.30)",
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
  components: {
    activityCard: {
      borderWidth: 1,
      radius: 16,
      padding: 14,
      gap: 8,
      iconSize: 40,
      iconRadius: 20,
      timeTop: 10,
      timeRight: 12,
      contentRightPadding: 36,
      dividerHeight: 1,
      dividerOpacity: 0.86,
      shadowOpacityMin: 0.14,
      shadowOpacityMax: 0.24,
      shadowRadiusMin: 12,
      shadowRadiusMax: 20,
      elevationMin: 2,
      elevationMax: 6,
    },
  },
};

export const lightThemeElectricViolet: ThemeTokens = {
  isDark: false,
  colors: {
    bg: "#F4F2FA",
    surface: "#FFFFFF",
    surfaceAlt: "#F3F4F6",
    border: "#E3E0EE",

    title: "#18122B",
    text: "#18122B",
    subtext: "#5E5A75",
    primary: "#18122B",

    overlay: "rgba(0,0,0,0.28)",
    shadow: "#000000",

    brand: "#6D5DF6",
    brandSoft: "rgba(109,93,246,0.14)",
    brandBorder: "rgba(109,93,246,0.28)",
    brandSurface: "#F3F1FF",
    brandSurfaceAlt: "rgba(109,93,246,0.10)",
    brandSurfacePressed: "rgba(109,93,246,0.22)",

    ink: "#1F1A33",
    inkSubtle: "#3B3550",
    inputBg: "#ECE9F7",
    tabBorder: "#E3E0EE",
    inactive: "#8A86A6",

    pageTitle: "#4B3BD9",

    settingsText: "#1F1A33",
    settingsSubtext: "#3B3550",
    settingsActionText: "#18122B",
    subtitleText: "#3B3550",

    tabBarTextActive: "#6D5DF6",
    tabBarTextInactive: "#8A86A6",
    segmentedTabTextActive: "#18122B",
    segmentedTabTextInactive: "#8A86A6",

    activityCardBorder: "rgba(109,93,246,0.24)",
    activityCardDivider: "rgba(109,93,246,0.20)",
    activityCardBg: "#F3F1FF",
    composerBg: "#E9E6FA",
    composerBorder: "rgba(109,93,246,0.30)",

    chipBg: "rgba(255,255,255,0.9)",
    chipBorder: "rgba(24,18,43,0.08)",

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

    mineBg: "rgba(109,93,246,0.12)",
    mineBorder: "rgba(109,93,246,0.26)",

    otherBg: "#F3F4F6",
    otherBorder: "#E5E7EB",

    systemText: "#5E5A75",
    systemBg: "rgba(109,93,246,0.06)",
    systemBorder: "rgba(109,93,246,0.16)",

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
  components: {
    activityCard: {
      borderWidth: 1,
      radius: 16,
      padding: 14,
      gap: 8,
      iconSize: 40,
      iconRadius: 20,
      timeTop: 10,
      timeRight: 12,
      contentRightPadding: 36,
      dividerHeight: 1,
      dividerOpacity: 0.6,
      shadowOpacityMin: 0.14,
      shadowOpacityMax: 0.22,
      shadowRadiusMin: 12,
      shadowRadiusMax: 18,
      elevationMin: 2,
      elevationMax: 6,
    },
  },
};

export const darkThemeElectricViolet: ThemeTokens = {
  isDark: true,
  colors: {
    bg: "#06060C",
    surface: "#0C0C18",
    surfaceAlt: "#12122A",
    border: "#23234A",

    title: "#EEEAFE",
    text: "#D6D2F2",
    subtext: "#8F8BC4",
    primary: "#EEEAFE",

    overlay: "rgba(0,0,0,0.78)",
    shadow: "#000000",

    brand: "#8B7CFF",
    brandSoft: "rgba(139,124,255,0.14)",
    brandBorder: "rgba(139,124,255,0.24)",
    brandSurface: "#0B0B16",
    brandSurfaceAlt: "rgba(109,93,246,0.14)",
    brandSurfacePressed: "rgba(139,124,255,0.26)",

    ink: "#EEEAFE",
    inkSubtle: "#B8B3E6",

    inputBg: "#0B0B16",
    tabBorder: "#23234A",
    inactive: "#7D79A8",

    pageTitle: "#8B7CFF",

    settingsText: "#D6D2F2",
    settingsSubtext: "#8F8BC4",
    settingsActionText: "#EEEAFE",
    subtitleText: "#8F8BC4",

    tabBarTextActive: "#8B7CFF",
    tabBarTextInactive: "#7D79A8",
    segmentedTabTextActive: "#EEEAFE",
    segmentedTabTextInactive: "#7D79A8",

    activityCardBorder: "rgba(139,124,255,0.26)",
    activityCardDivider: "rgba(139,124,255,0.22)",
    activityCardBg: "#12122A",
    composerBg: "#0B0B16",
    composerBorder: "rgba(139,124,255,0.28)",

    chipBg: "rgba(18,18,42,0.72)",
    chipBorder: "rgba(139,124,255,0.26)",

    createdBg: "rgba(37,99,235,0.14)",
    createdBorder: "rgba(37,99,235,0.28)",
    createdText: "#C7D2FE",

    joinedBg: "rgba(139,124,255,0.12)",
    joinedBorder: "rgba(139,124,255,0.26)",
    joinedText: "#D6D2F2",

    expiredBg: "rgba(220,38,38,0.14)",
    expiredBorder: "rgba(220,38,38,0.28)",
    expiredText: "#FECACA",

    soonBg: "rgba(217,119,6,0.14)",
    soonBorder: "rgba(217,119,6,0.28)",
    soonText: "#FDE68A",

    mineBg: "rgba(139,124,255,0.12)",
    mineBorder: "rgba(139,124,255,0.26)",

    otherBg: "rgba(148,163,184,0.07)",
    otherBorder: "rgba(148,163,184,0.16)",

    systemText: "#8F8BC4",
    systemBg: "rgba(139,124,255,0.06)",
    systemBorder: "rgba(139,124,255,0.16)",

    dangerText: "#FECACA",
    dangerBg: "rgba(220,38,38,0.14)",
    dangerBorder: "rgba(220,38,38,0.28)",

    okText: "#BDF6EA",
    okBg: "rgba(34,197,94,0.18)",
    okBorder: "rgba(34,197,94,0.34)",
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
  components: {
    activityCard: {
      borderWidth: 1,
      radius: 16,
      padding: 14,
      gap: 8,
      iconSize: 40,
      iconRadius: 20,
      timeTop: 10,
      timeRight: 12,
      contentRightPadding: 36,
      dividerHeight: 1,
      dividerOpacity: 0.86,
      shadowOpacityMin: 0.14,
      shadowOpacityMax: 0.26,
      shadowRadiusMin: 12,
      shadowRadiusMax: 20,
      elevationMin: 2,
      elevationMax: 6,
    },
  },
};
