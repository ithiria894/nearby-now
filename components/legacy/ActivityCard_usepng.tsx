import React, { useMemo, useState } from "react";
import { Alert, Image, Modal, Pressable, Text, View } from "react-native";
import { useT } from "../lib/i18n/useT";
import { useTheme } from "../src/ui/theme/ThemeProvider";
import { lightTheme } from "../src/ui/theme/tokens";

/* =======================
 * Types
 * ======================= */
export type ActivityCardActivity = {
  id: string;
  creator_id: string;
  title_text: string;
  place_name: string | null;
  place_address: string | null;
  place_text?: string | null;
  lat?: number | null;
  lng?: number | null;
  expires_at: string | null;
  gender_pref: string;
  capacity: number | null;
  status: string;
  created_at?: string | null;
};

export type MembershipState = "none" | "joined" | "left";

type Props = {
  activity: ActivityCardActivity;
  currentUserId: string | null;
  membershipState: MembershipState;
  isJoining: boolean;
  onPressCard: () => void;
  onPressEdit?: () => void;
};

/* =======================
 * Card Templates (3)
 * ======================= */
// :zap: CHANGE 1: Use 3 scrapbook templates (PNG)
const CARD_TEMPLATES = [
  { bg: require("../assets/activity-cards/card_template_1.png"), icon: "🎯" },
  { bg: require("../assets/activity-cards/card_template_2.png"), icon: "🎬" },
  { bg: require("../assets/activity-cards/card_template_3.png"), icon: "🍜" },
] as const;

/* =======================
 * Helpers
 * ======================= */

// :zap: CHANGE 2: Stable template pick per activity id
function pickTemplateIndex(activityId: string) {
  let h = 0;
  for (let i = 0; i < activityId.length; i += 1) {
    h = (h * 31 + activityId.charCodeAt(i)) >>> 0;
  }
  return h % CARD_TEMPLATES.length;
}

// :zap: CHANGE 3: Ultra-short gender label
function shortGender(g: string) {
  const v = (g ?? "").toLowerCase().trim();
  if (v === "female" || v === "f") return "F";
  if (v === "male" || v === "m") return "M";
  return "Any";
}

// :zap: CHANGE 4: Time + urgency
function timeLeft(t: (key: string) => string, expiresAt: string | null) {
  if (!expiresAt)
    return { label: t("activityCard.noExpiry"), urgency: "normal" as const };

  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0)
    return { label: t("activityCard.expired"), urgency: "expired" as const };

  const mins = Math.floor(ms / 60000);
  if (mins < 15) return { label: `${mins}m`, urgency: "critical" as const };
  if (mins < 60) return { label: `${mins}m`, urgency: "soon" as const };

  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0
    ? { label: `${hrs}h`, urgency: "normal" as const }
    : { label: `${hrs}h ${rem}m`, urgency: "normal" as const };
}

// :zap: CHANGE 5: Sticker-like chip
function Chip({
  label,
  bg,
  border,
  color,
  bold,
}: {
  label: string;
  bg: string;
  border: string;
  color: string;
  bold?: boolean;
}) {
  return (
    <View
      style={{
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1,
        backgroundColor: bg,
        borderColor: border,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: bold ? "900" : "800", color }}>
        {label}
      </Text>
    </View>
  );
}

// :zap: CHANGE 6: Cross-platform menu item
function MenuItem({
  label,
  onPress,
  destructive,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const theme = useTheme();
  const TOKENS = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 16,
        paddingVertical: 14,
        opacity: pressed ? 0.65 : 1,
      })}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "800",
          color: destructive ? TOKENS.dangerText : TOKENS.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function ActivityCard({
  activity: a,
  currentUserId,
  membershipState,
  isJoining,
  onPressCard,
  onPressEdit,
}: Props) {
  const theme = useTheme();
  const TOKENS = theme.colors;
  const { t } = useT();
  const isCreator = !!currentUserId && a.creator_id === currentUserId;
  const cardTokens = theme.isDark ? lightTheme.colors : TOKENS;

  const placeName =
    (a.place_name ?? a.place_text ?? "").trim() || t("activityCard.place_none");
  const placeAddress = (a.place_address ?? "").trim();

  const time = timeLeft(t, a.expires_at);
  const [menuOpen, setMenuOpen] = useState(false);

  const templateIdx = useMemo(() => pickTemplateIndex(a.id), [a.id]);
  const template = CARD_TEMPLATES[templateIdx];

  const timeChipStyle = useMemo(() => {
    if (time.urgency === "critical" || time.urgency === "expired") {
      return {
        bg: cardTokens.expiredBg,
        border: cardTokens.expiredBorder,
        color: cardTokens.expiredText,
        bold: true,
      };
    }
    if (time.urgency === "soon") {
      return {
        bg: cardTokens.soonBg,
        border: cardTokens.soonBorder,
        color: cardTokens.soonText,
        bold: true,
      };
    }
    return {
      bg: cardTokens.chipBg,
      border: cardTokens.chipBorder,
      color: cardTokens.text,
      bold: false,
    };
  }, [cardTokens, time.label, time.urgency]);

  function notImplemented(action: "share" | "report" | "delete") {
    const titleKey = `activityCard.notImplementedTitle_${action}` as const;
    Alert.alert(t(titleKey), t("activityCard.notImplementedBody"));
  }

  function runAction(action: "edit" | "share" | "report" | "delete") {
    setMenuOpen(false);

    if (action === "edit") {
      if (!isCreator) return;
      if (!onPressEdit) return;
      onPressEdit();
      return;
    }

    if (action === "share") return notImplemented("share");
    if (action === "report") return notImplemented("report");
    if (action === "delete") return notImplemented("delete");
  }

  return (
    <>
      <Pressable
        onPress={onPressCard}
        disabled={isJoining}
        // :zap: CHANGE 7: Keep press feedback only; visuals are inside the card frame
        style={({ pressed }) => ({
          opacity: isJoining ? 0.6 : pressed ? 0.92 : 1,
          ...(pressed ? { transform: [{ scale: 0.99 }] } : {}),
        })}
      >
        {/* :zap: CHANGE 8: Card frame controlled by fixed height + background image ratio */}
        <View
          style={{
            width: "100%",
            height: 132, // :zap: CHANGE 9: Adjust this number to match your PNG template look
            borderRadius: 18,
            overflow: "hidden",
          }}
        >
          {/* :zap: CHANGE 10: Background template is absolute + contain so it shows fully */}
          <Image
            source={template.bg}
            resizeMode="contain"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
            }}
          />

          {/* :zap: CHANGE 11: Content overlay */}
          <View
            style={{
              flex: 1,
              paddingHorizontal: 16,
              paddingVertical: 12,
              justifyContent: "center", // ✅ vertical center
            }}
          >
            {/* :zap: CHANGE 12: Always show "..." on top-right */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                setMenuOpen(true);
              }}
              hitSlop={16}
              style={({ pressed }) => ({
                position: "absolute",
                top: 6,
                right: 6,
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
                backgroundColor: pressed
                  ? "rgba(255,255,255,0.70)"
                  : "rgba(255,255,255,0.55)",
              })}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "900",
                  color: cardTokens.subtext,
                }}
              >
                ⋯
              </Text>
            </Pressable>

            <View
              style={{
                flexDirection: "row",
                gap: 10,
                alignItems: "center",
                justifyContent: "center", // ✅ horizontal center
              }}
            >
              {/* :zap: CHANGE 13: Small icon badge */}
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.86)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 14 }}>{template.icon}</Text>
              </View>

              {/* Main */}
              <View style={{ flex: 1, gap: 4, paddingTop: 2 }}>
                {/* Title */}
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 15,
                    fontWeight: "900",
                    lineHeight: 18,
                    color: cardTokens.title,
                    paddingRight: 44,
                  }}
                >
                  {a.title_text}
                </Text>

                {/* Place */}
                <View style={{ gap: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 13,
                      fontWeight: "800",
                      color: cardTokens.text,
                    }}
                  >
                    {placeName}
                  </Text>

                  {placeAddress ? (
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 11,
                        lineHeight: 13,
                        color: cardTokens.subtext,
                      }}
                    >
                      {placeAddress}
                    </Text>
                  ) : null}
                </View>

                {/* Chips */}
                <View
                  // :zap: CHANGE 14: Push chips to the bottom to match template spacing
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  {isCreator ? (
                    <Chip
                      label={t("activityCard.chip_created")}
                      bg={cardTokens.createdBg}
                      border={cardTokens.createdBorder}
                      color={cardTokens.createdText}
                      bold
                    />
                  ) : null}

                  <Chip
                    label={t("activityCard.chip_time", { label: time.label })}
                    bg={timeChipStyle.bg}
                    border={timeChipStyle.border}
                    color={timeChipStyle.color}
                    bold={timeChipStyle.bold}
                  />

                  <Chip
                    label={t("activityCard.chip_pref", {
                      value: shortGender(a.gender_pref),
                    })}
                    bg={cardTokens.chipBg}
                    border={cardTokens.chipBorder}
                    color={cardTokens.text}
                  />

                  <Chip
                    label={t("activityCard.chip_cap", {
                      value: a.capacity ?? "∞",
                    })}
                    bg={cardTokens.chipBg}
                    border={cardTokens.chipBorder}
                    color={cardTokens.text}
                  />

                  {membershipState === "joined" ? (
                    <Chip
                      label={t("activityCard.chip_joined")}
                      bg={cardTokens.joinedBg}
                      border={cardTokens.joinedBorder}
                      color={cardTokens.joinedText}
                      bold
                    />
                  ) : membershipState === "left" ? (
                    <Chip
                      label={t("activityCard.chip_left")}
                      bg={cardTokens.chipBg}
                      border={cardTokens.chipBorder}
                      color={cardTokens.subtext}
                    />
                  ) : null}
                </View>
              </View>
            </View>
          </View>
        </View>
      </Pressable>

      {/* Menu */}
      <Modal
        transparent
        visible={menuOpen}
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          onPress={() => setMenuOpen(false)}
          style={{
            flex: 1,
            backgroundColor: TOKENS.overlay,
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: TOKENS.surface,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderWidth: 1,
              borderColor: TOKENS.border,
              paddingTop: 10,
              paddingBottom: 12,
            }}
          >
            <View
              style={{
                alignSelf: "center",
                width: 42,
                height: 4,
                borderRadius: 999,
                backgroundColor: TOKENS.subtext,
                marginBottom: 10,
              }}
            />

            {isCreator ? (
              <>
                <MenuItem
                  label={t("activityCard.menu.edit")}
                  onPress={() => runAction("edit")}
                />
                <MenuItem
                  label={t("activityCard.menu.delete")}
                  destructive
                  onPress={() => runAction("delete")}
                />
              </>
            ) : null}

            <MenuItem
              label={t("activityCard.menu.share")}
              onPress={() => runAction("share")}
            />
            <MenuItem
              label={t("activityCard.menu.report")}
              onPress={() => runAction("report")}
            />

            <View style={{ height: 8 }} />
            <MenuItem
              label={t("activityCard.menu.cancel")}
              onPress={() => setMenuOpen(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
