import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../src/ui/theme/ThemeProvider";

const FONT_SAMPLES: Array<{
  label: string;
  fontFamily: string;
}> = [
  // 你現有
  { label: "PatrickHand", fontFamily: "PatrickHand" },
  { label: "Kalam", fontFamily: "Kalam" },
  { label: "KalamBold", fontFamily: "KalamBold" },

  { label: "Caveat", fontFamily: "Caveat" },
  { label: "CaveatSemi", fontFamily: "CaveatSemi" },
  { label: "CaveatBold", fontFamily: "CaveatBold" },

  // 新加
  { label: "Inter", fontFamily: "Inter" },
  { label: "InterSemi", fontFamily: "InterSemi" },

  { label: "Nunito", fontFamily: "Nunito" },
  { label: "NunitoBold", fontFamily: "NunitoBold" },

  { label: "PoppinsSemi", fontFamily: "PoppinsSemi" },
  { label: "PoppinsBold", fontFamily: "PoppinsBold" },

  { label: "Montserrat", fontFamily: "Montserrat" },
  { label: "MontserratBold", fontFamily: "MontserratBold" },

  { label: "ShortStack", fontFamily: "ShortStack" },
];

export default function AllFontScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const bg = theme.colors.bg;
  const text = theme.colors.text;
  const sub = theme.colors.subtext;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: 12 + insets.top,
          paddingBottom: 24 + insets.bottom,
          paddingHorizontal: 16,
          gap: 14,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "800", color: text }}>
          All Fonts
        </Text>
        <Text style={{ fontSize: 13, color: sub, lineHeight: 18 }}>
          每個 block 會用唔同 fontFamily 渲染。你可以直接 copy fontFamily key
          去用。
        </Text>

        {FONT_SAMPLES.map((f) => (
          <View
            key={f.fontFamily}
            style={{
              borderWidth: 1,
              borderColor: theme.colors.border ?? theme.colors.tabBorder,
              backgroundColor: theme.isDark
                ? theme.colors.surface
                : theme.colors.bg,
              borderRadius: 16,
              padding: 12,
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 12, color: sub }}>
              fontFamily: {f.fontFamily}
            </Text>

            <Text
              style={{
                fontFamily: f.fontFamily,
                fontSize: 26,
                color: text,
              }}
            >
              {f.label}: The quick brown fox 123
            </Text>

            <Text
              style={{
                fontFamily: f.fontFamily,
                fontSize: 16,
                color: text,
                opacity: 0.9,
              }}
            >
              你好 / 日本語 / 가나다라 — UI Sample
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
