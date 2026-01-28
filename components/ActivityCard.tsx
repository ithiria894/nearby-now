import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  Text,
  View,
  Image,
  StyleSheet,
} from "react-native";
// <- 改成你實際路徑
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
 * Design Tokens
 * ======================= */
const TOKENS = {
  title: "#111827",
  text: "#1F2937",
  subtext: "#6B7280",

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

  overlay: "rgba(0,0,0,0.28)",
} as const;

/* =======================
 * Card Templates (3)
 * ======================= */
const CARD_TEMPLATES = [
  { bg: require("../assets/activity-cards/card_template_1.png"), icon: "🎯" },
  { bg: require("../assets/activity-cards/card_template_2.png"), icon: "🎬" },
  { bg: require("../assets/activity-cards/card_template_3.png"), icon: "🍜" },
] as const;

/* =======================
 * Helpers
 * ======================= */
function pickTemplateIndex(activityId: string) {
  let h = 0;
  for (let i = 0; i < activityId.length; i += 1) {
    h = (h * 31 + activityId.charCodeAt(i)) >>> 0;
  }
  return h % CARD_TEMPLATES.length;
}

function shortGender(g: string) {
  const v = (g ?? "").toLowerCase().trim();
  if (v === "female" || v === "f") return "F";
  if (v === "male" || v === "m") return "M";
  return "Any";
}

function timeLeft(expiresAt: string | null) {
  if (!expiresAt) return { label: "No expiry", urgency: "normal" as const };

  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return { label: "Expired", urgency: "expired" as const };

  const mins = Math.floor(ms / 60000);
  if (mins < 15)
    return { label: `${Math.max(mins, 0)}m`, urgency: "critical" as const };
  if (mins < 60) return { label: `${mins}m`, urgency: "soon" as const };

  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0
    ? { label: `${hrs}h`, urgency: "normal" as const }
    : { label: `${hrs}h ${rem}m`, urgency: "normal" as const };
}

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

function MenuItem({
  label,
  onPress,
  destructive,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
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
          color: destructive ? "#B91C1C" : "#111827",
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
  const isCreator = !!currentUserId && a.creator_id === currentUserId;

  const placeName = (a.place_name ?? a.place_text ?? "").trim() || "No place";
  const placeAddress = (a.place_address ?? "").trim();

  const time = timeLeft(a.expires_at);
  const [menuOpen, setMenuOpen] = useState(false);

  const templateIdx = useMemo(() => pickTemplateIndex(a.id), [a.id]);
  const template = CARD_TEMPLATES[templateIdx];

  // ✅ iPad capped width (唔好自己扣 gutter，因為通常 parent 已經有 padding)
  const MAX_CARD_WIDTH = 720;

  const timeChipStyle = useMemo(() => {
    if (time.urgency === "critical" || time.urgency === "expired") {
      return {
        bg: TOKENS.expiredBg,
        border: TOKENS.expiredBorder,
        color: TOKENS.expiredText,
        bold: true,
      };
    }
    if (time.urgency === "soon") {
      return {
        bg: TOKENS.soonBg,
        border: TOKENS.soonBorder,
        color: TOKENS.soonText,
        bold: true,
      };
    }
    return {
      bg: TOKENS.chipBg,
      border: TOKENS.chipBorder,
      color: TOKENS.text,
      bold: false,
    };
  }, [time.label, time.urgency]);

  function notImplemented(name: string) {
    Alert.alert(name, "Not implemented yet.");
  }

  function runAction(action: "edit" | "share" | "report" | "delete") {
    setMenuOpen(false);

    if (action === "edit") {
      if (!isCreator) return;
      if (!onPressEdit) return;
      onPressEdit();
      return;
    }

    if (action === "share") return notImplemented("Share");
    if (action === "report") return notImplemented("Report");
    if (action === "delete") return notImplemented("Delete");
  }

  return (
    <>
      <Pressable
        onPress={onPressCard}
        disabled={isJoining}
        style={({ pressed }) => ({
          opacity: isJoining ? 0.6 : pressed ? 0.92 : 1,
          ...(pressed ? { transform: [{ scale: 0.99 }] } : {}),
        })}
      >
        {/* ✅ Outer wrapper: fill parent, cap on iPad, center */}
        <View
          style={{
            width: "100%",
            maxWidth: MAX_CARD_WIDTH,
            alignSelf: "center",
          }}
        >
          {/* ✅ Card container controls “final stretched size” */}
          <View
            style={{
              borderRadius: 18,
              overflow: "hidden",
              minHeight: 96,
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 14,
              justifyContent: "center",
            }}
          >
            {/* ✅ THE KEY: background PNG is ABSOLUTE FILL + STRETCH (橡筋扯到同容器一樣大) */}
            <Image
              source={template.bg}
              resizeMode="stretch"
              style={[
                StyleSheet.absoluteFillObject,
                { width: undefined, height: undefined },
              ]}
            />

            {/* Menu button */}
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
                  color: TOKENS.subtext,
                }}
              >
                ⋯
              </Text>
            </Pressable>

            <View
              style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
            >
              {/* Icon badge */}
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
              <View style={{ flex: 1, minWidth: 0, gap: 4, paddingTop: 2 }}>
                {/* Title */}
                <Text
                  numberOfLines={2}
                  style={{
                    fontSize: 15,
                    fontWeight: "900",
                    lineHeight: 18,
                    color: TOKENS.title,
                    paddingRight: 44,
                    flexShrink: 1,
                  }}
                >
                  {a.title_text}
                </Text>

                {/* Place */}
                <View style={{ gap: 1, minWidth: 0 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 13,
                      fontWeight: "800",
                      color: TOKENS.text,
                      flexShrink: 1,
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
                        color: TOKENS.subtext,
                        flexShrink: 1,
                      }}
                    >
                      {placeAddress}
                    </Text>
                  ) : null}
                </View>

                {/* Chips */}
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 6,
                    alignItems: "flex-start",
                    paddingTop: 4,
                  }}
                >
                  {isCreator ? (
                    <Chip
                      label="Created"
                      bg={TOKENS.createdBg}
                      border={TOKENS.createdBorder}
                      color={TOKENS.createdText}
                      bold
                    />
                  ) : null}

                  <Chip
                    label={`⏳ ${time.label}`}
                    bg={
                      time.urgency === "critical" || time.urgency === "expired"
                        ? TOKENS.expiredBg
                        : time.urgency === "soon"
                          ? TOKENS.soonBg
                          : TOKENS.chipBg
                    }
                    border={
                      time.urgency === "critical" || time.urgency === "expired"
                        ? TOKENS.expiredBorder
                        : time.urgency === "soon"
                          ? TOKENS.soonBorder
                          : TOKENS.chipBorder
                    }
                    color={
                      time.urgency === "critical" || time.urgency === "expired"
                        ? TOKENS.expiredText
                        : time.urgency === "soon"
                          ? TOKENS.soonText
                          : TOKENS.text
                    }
                    bold={time.urgency !== "normal"}
                  />

                  <Chip
                    label={`Pref ${shortGender(a.gender_pref)}`}
                    bg={TOKENS.chipBg}
                    border={TOKENS.chipBorder}
                    color={TOKENS.text}
                  />

                  <Chip
                    label={`Cap ${a.capacity ?? "∞"}`}
                    bg={TOKENS.chipBg}
                    border={TOKENS.chipBorder}
                    color={TOKENS.text}
                  />

                  {membershipState === "joined" ? (
                    <Chip
                      label="Joined"
                      bg={TOKENS.joinedBg}
                      border={TOKENS.joinedBorder}
                      color={TOKENS.joinedText}
                      bold
                    />
                  ) : membershipState === "left" ? (
                    <Chip
                      label="Left"
                      bg={TOKENS.chipBg}
                      border={TOKENS.chipBorder}
                      color={TOKENS.subtext}
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
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(229,231,235,1)",
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
                backgroundColor: "#E5E7EB",
                marginBottom: 10,
              }}
            />

            {isCreator ? (
              <>
                <MenuItem label="Edit" onPress={() => runAction("edit")} />
                <MenuItem
                  label="Delete"
                  destructive
                  onPress={() => runAction("delete")}
                />
              </>
            ) : null}

            <MenuItem label="Share" onPress={() => runAction("share")} />
            <MenuItem label="Report" onPress={() => runAction("report")} />

            <View style={{ height: 8 }} />
            <MenuItem label="Cancel" onPress={() => setMenuOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
