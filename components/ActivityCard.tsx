import React, { useMemo, useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";

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
  cardBg: "#FFFFFF",
  border: "#E5E7EB",
  title: "#111827",
  text: "#1F2937",
  subtext: "#6B7280",

  chipBg: "#F3F4F6",
  chipBorder: "#E5E7EB",

  // status / meta chips
  createdBg: "#DBEAFE",
  createdBorder: "#BFDBFE",
  createdText: "#1D4ED8",

  joinedBg: "#DCFCE7",
  joinedBorder: "#BBF7D0",
  joinedText: "#166534",

  expiredBg: "#FEE2E2",
  expiredBorder: "#FECACA",
  expiredText: "#991B1B",

  soonBg: "#FEF3C7",
  soonBorder: "#FDE68A",
  soonText: "#92400E",

  overlay: "rgba(0,0,0,0.28)",
} as const;

/* =======================
 * Helpers
 * ======================= */

// :zap: CHANGE 1: Ultra-short gender label
function shortGender(g: string) {
  const v = (g ?? "").toLowerCase().trim();
  if (v === "female" || v === "f") return "F";
  if (v === "male" || v === "m") return "M";
  return "Any";
}

// :zap: CHANGE 2: Time + urgency
function timeLeft(expiresAt: string | null) {
  if (!expiresAt) return { label: "No expiry", urgency: "normal" as const };

  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return { label: "Expired", urgency: "expired" as const };

  const mins = Math.floor(ms / 60000);
  if (mins < 15) return { label: `${mins}m`, urgency: "critical" as const };
  if (mins < 60) return { label: `${mins}m`, urgency: "soon" as const };

  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0
    ? { label: `${hrs}h`, urgency: "normal" as const }
    : { label: `${hrs}h ${rem}m`, urgency: "normal" as const };
}

// :zap: CHANGE 3: Compact reusable chip
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
        paddingVertical: 3,
        paddingHorizontal: 9,
        borderRadius: 999,
        borderWidth: 1,
        backgroundColor: bg,
        borderColor: border,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: bold ? "800" : "700", color }}>
        {label}
      </Text>
    </View>
  );
}

// :zap: CHANGE 4: Cross-platform menu item
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

  // :zap: CHANGE 5: Placeholder actions
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
        // :zap: CHANGE 6: Fix RN/Hermes transform crash + allow floating menu
        style={({ pressed }) => ({
          position: "relative",
          padding: 12,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: TOKENS.border,
          backgroundColor: TOKENS.cardBg,
          opacity: isJoining ? 0.6 : pressed ? 0.92 : 1,
          ...(pressed ? { transform: [{ scale: 0.985 }] } : {}),
          shadowColor: "#000",
          shadowOpacity: 0.07,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        })}
      >
        {/* :zap: CHANGE 7: Always show "..." for all activities; large tap target */}
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
            backgroundColor: pressed ? "#F3F4F6" : "#FFFFFF",
          })}
        >
          <Text
            style={{ fontSize: 18, fontWeight: "900", color: TOKENS.subtext }}
          >
            ⋯
          </Text>
        </Pressable>

        <View style={{ flexDirection: "row", gap: 10 }}>
          {/* Avatar */}
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: TOKENS.chipBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 18 }}>🎯</Text>
          </View>

          {/* Main */}
          <View style={{ flex: 1, gap: 6 }}>
            {/* Title */}
            <Text
              numberOfLines={2}
              style={{
                fontSize: 15,
                fontWeight: "800",
                lineHeight: 19,
                color: TOKENS.title,
                paddingRight: 44, // reserve for ...
              }}
            >
              {a.title_text}
            </Text>

            {/* Place */}
            <View style={{ gap: 1 }}>
              <Text
                numberOfLines={1}
                style={{ fontSize: 13, fontWeight: "700", color: TOKENS.text }}
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
                  }}
                >
                  {placeAddress}
                </Text>
              ) : null}
            </View>

            {/* Chips */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {/* :zap: CHANGE 8: Move "Created" into chips row to avoid overlap with ... */}
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
                bg={timeChipStyle.bg}
                border={timeChipStyle.border}
                color={timeChipStyle.color}
                bold={timeChipStyle.bold}
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
      </Pressable>

      {/* :zap: CHANGE 9: Unified menu for iOS/Android/Web */}
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
                backgroundColor: "#E5E7EB",
                marginBottom: 10,
              }}
            />

            {/* Creator-only actions */}
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

            {/* Everyone actions */}
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
