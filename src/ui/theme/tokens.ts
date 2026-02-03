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
