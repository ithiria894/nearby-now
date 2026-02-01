import { useMemo, useRef, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { backend } from "../lib/backend";
import { requireUserId } from "../lib/domain/auth";
import { useT } from "../lib/i18n/useT";
import { Screen, PrimaryButton } from "../src/ui/common";
import { useTheme } from "../src/ui/theme/ThemeProvider";

export default function ComposeScreen() {
  const router = useRouter();
  const { t } = useT();
  const theme = useTheme();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [successLine, setSuccessLine] = useState<string>("");
  const successSheetRef = useRef<BottomSheetModal>(null);
  const successSnapPoints = useMemo(() => ["45%"], []);
  const templates = [
    t("compose.template_1"),
    t("compose.template_2"),
    t("compose.template_3"),
    t("compose.template_4"),
    t("compose.template_5"),
    t("compose.template_6"),
  ];

  const successLines = useMemo(
    () => [
      t("compose.success_line_1"),
      t("compose.success_line_2"),
      t("compose.success_line_3"),
      t("compose.success_line_4"),
      t("compose.success_line_5"),
    ],
    [t]
  );

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
  );

  async function onSubmit() {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const userId = await requireUserId();
      const { data, error } = await backend.activities.createActivity({
        creator_id: userId,
        title_text: text.trim(),
        status: "open",
      });

      if (error) throw error;

      const { error: joinErr } = await backend.activities.upsertActivityMember({
        activity_id: data.id,
        user_id: userId,
        role: "creator",
        state: "joined",
      });

      if (joinErr) throw joinErr;

      setCreatedId(data.id);
      const pick =
        successLines[Math.floor(Math.random() * successLines.length)] ??
        t("compose.success_line_1");
      setSuccessLine(pick);
      successSheetRef.current?.present();
    } catch (e: any) {
      console.error(e);
      Alert.alert(t("compose.errorTitle"), e?.message ?? "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <Text
        style={{ fontSize: 20, fontWeight: "800", color: theme.colors.title }}
      >
        {t("compose.title")}
      </Text>
      <Text style={{ fontSize: 13, color: theme.colors.subtext }}>
        {t("compose.subtitle")}
      </Text>

      <View style={{ gap: 8 }}>
        <Text
          style={{ fontSize: 13, fontWeight: "800", color: theme.colors.title }}
        >
          {t("compose.template_label")}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {templates.map((tpl) => (
            <Pressable
              key={tpl}
              onPress={() => setText(tpl)}
              style={({ pressed }) => ({
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: pressed
                  ? theme.isDark
                    ? theme.colors.surfaceAlt
                    : "#EAF4E2"
                  : theme.isDark
                    ? theme.colors.surface
                    : "#F6F9F2",
              })}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: theme.colors.text,
                }}
              >
                {tpl}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={{ fontSize: 12, color: theme.colors.subtext }}>
          {t("compose.template_hint")}
        </Text>
      </View>

      <View
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 14,
          backgroundColor: theme.colors.surface,
          padding: 12,
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t("compose.placeholder")}
          placeholderTextColor={theme.colors.subtext}
          multiline
          textAlignVertical="top"
          style={{
            minHeight: 120,
            fontSize: 16,
            color: theme.colors.text,
          }}
        />
      </View>

      <PrimaryButton
        label={submitting ? t("common.loading") : t("compose.submit")}
        onPress={onSubmit}
        disabled={submitting || !text.trim()}
      />

      <BottomSheetModal
        ref={successSheetRef}
        snapPoints={successSnapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
        }}
        handleIndicatorStyle={{
          backgroundColor: theme.colors.border,
        }}
      >
        <BottomSheetView style={{ padding: 16, gap: 12 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              color: theme.colors.title,
            }}
          >
            {t("compose.success_title")}
          </Text>
          <Text style={{ fontSize: 13, color: theme.colors.subtext }}>
            {successLine}
          </Text>
          <Text style={{ fontSize: 13, color: theme.colors.subtext }}>
            {t("compose.success_guidance")}
          </Text>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
            <Pressable
              onPress={() => {
                successSheetRef.current?.dismiss();
                router.replace("/(tabs)/browse");
              }}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: pressed
                  ? theme.isDark
                    ? theme.colors.surfaceAlt
                    : "#EAF4E2"
                  : theme.isDark
                    ? theme.colors.surface
                    : "#F6F9F2",
                alignItems: "center",
              })}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "800",
                  color: theme.colors.text,
                }}
              >
                {t("compose.success_wait")}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (!createdId) return;
                successSheetRef.current?.dismiss();
                router.push(`/edit/${createdId}`);
              }}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: pressed
                  ? theme.isDark
                    ? theme.colors.surfaceAlt
                    : "#E2F0D8"
                  : theme.isDark
                    ? theme.colors.surface
                    : "#EAF4E2",
                alignItems: "center",
              })}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "800",
                  color: theme.colors.text,
                }}
              >
                {t("compose.success_edit")}
              </Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </Screen>
  );
}
