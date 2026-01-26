import { Pressable, Text, View } from "react-native";

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
  created_at?: string;
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

// :zap: CHANGE 1: Centralized design tokens (simple, consistent, easy to tweak).
const TOKENS = {
  card: {
    bg: "#FFFFFF",
    border: "#E6E8EB",
    title: "#111827",
    text: "#1F2937",
    subtext: "#6B7280",
  },
  chip: {
    bg: "#F3F4F6",
    border: "#E5E7EB",
    text: "#111827",
  },
  status: {
    closedBg: "#FEF3C7",
    closedBorder: "#FDE68A",
    closedText: "#92400E",
    expiredBg: "#FEE2E2",
    expiredBorder: "#FECACA",
    expiredText: "#991B1B",
  },
  join: {
    joinedBg: "#DCFCE7",
    joinedBorder: "#BBF7D0",
    joinedText: "#166534",
    leftBg: "#E5E7EB",
    leftBorder: "#D1D5DB",
    leftText: "#374151",
    hintText: "#6B7280",
  },
} as const;

// :zap: CHANGE 2: Robust gender preference short label.
function formatGenderPrefShort(genderPref: string): string {
  const raw = (genderPref ?? "").toLowerCase().trim();
  if (raw === "female" || raw === "f") return "F";
  if (raw === "male" || raw === "m") return "M";
  return "Any";
}

function formatTimeLeft(expiresAtIso: string | null): string {
  if (!expiresAtIso) return "No expiry";
  const ms = new Date(expiresAtIso).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0 ? `${hrs}h` : `${hrs}h ${rem}m`;
}

// :zap: CHANGE 3: Status label + styling intent.
function computeStatusLabel(
  a: ActivityCardActivity
): "Closed" | "Expired" | null {
  if (a.status && a.status !== "open") return "Closed";
  if (a.expires_at) {
    const ms = new Date(a.expires_at).getTime() - Date.now();
    if (ms <= 0) return "Expired";
  }
  return null;
}

// :zap: CHANGE 4: Membership helper -> chip label + colors.
function membershipChip(membershipState: MembershipState): {
  label: string;
  bg: string;
  border: string;
  text: string;
} {
  if (membershipState === "joined") {
    return {
      label: "Joined",
      bg: TOKENS.join.joinedBg,
      border: TOKENS.join.joinedBorder,
      text: TOKENS.join.joinedText,
    };
  }
  if (membershipState === "left") {
    return {
      label: "Left",
      bg: TOKENS.join.leftBg,
      border: TOKENS.join.leftBorder,
      text: TOKENS.join.leftText,
    };
  }
  return {
    label: "Tap to join",
    bg: TOKENS.chip.bg,
    border: TOKENS.chip.border,
    text: TOKENS.join.hintText,
  };
}

// :zap: CHANGE 5: Reusable Chip with color support.
function Chip({
  label,
  bg,
  border,
  textColor,
  weight = "700",
}: {
  label: string;
  bg: string;
  border: string;
  textColor: string;
  weight?: "600" | "700" | "800";
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
      <Text style={{ fontSize: 12, fontWeight: weight, color: textColor }}>
        {label}
      </Text>
    </View>
  );
}

export default function ActivityCard(props: Props) {
  const {
    activity: a,
    currentUserId,
    membershipState,
    isJoining,
    onPressCard,
    onPressEdit,
  } = props;

  const isCreator = !!currentUserId && a.creator_id === currentUserId;
  const statusLabel = computeStatusLabel(a);

  const placeName = (a.place_name ?? a.place_text ?? "").trim() || "No place";
  const placeAddress = (a.place_address ?? "").trim();

  const timeLeft = formatTimeLeft(a.expires_at);
  const genderShort = formatGenderPrefShort(a.gender_pref);
  const cap = a.capacity ?? "∞";

  const member = membershipChip(membershipState);

  const statusChip =
    statusLabel === "Expired"
      ? {
          label: "Expired",
          bg: TOKENS.status.expiredBg,
          border: TOKENS.status.expiredBorder,
          text: TOKENS.status.expiredText,
        }
      : statusLabel === "Closed"
        ? {
            label: "Closed",
            bg: TOKENS.status.closedBg,
            border: TOKENS.status.closedBorder,
            text: TOKENS.status.closedText,
          }
        : null;

  return (
    <Pressable
      onPress={onPressCard}
      disabled={isJoining}
      style={{
        padding: 14,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: TOKENS.card.border,
        backgroundColor: TOKENS.card.bg,
        opacity: isJoining ? 0.6 : 1,

        // :zap: CHANGE 6: "More premium" shadow/elevation that behaves well on iOS + Android.
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
      }}
    >
      {/* Title row */}
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text
              numberOfLines={2}
              style={{
                fontSize: 16,
                fontWeight: "800",
                flex: 1,
                lineHeight: 20,
                color: TOKENS.card.title,
              }}
            >
              {a.title_text}
            </Text>

            {statusChip ? (
              <Chip
                label={statusChip.label}
                bg={statusChip.bg}
                border={statusChip.border}
                textColor={statusChip.text}
                weight="800"
              />
            ) : null}
          </View>

          {/* Place */}
          <View style={{ gap: 2 }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: TOKENS.card.text,
              }}
            >
              {placeName}
            </Text>

            {/* :zap: CHANGE 7: Address smaller + lighter */}
            {placeAddress ? (
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 11,
                  lineHeight: 14,
                  color: TOKENS.card.subtext,
                }}
              >
                {placeAddress}
              </Text>
            ) : null}
          </View>

          {/* Chips row */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {/* time */}
            <Chip
              label={`⏳ ${timeLeft}`}
              bg={TOKENS.chip.bg}
              border={TOKENS.chip.border}
              textColor={TOKENS.chip.text}
            />

            {/* gender (short) */}
            <Chip
              label={`Pref: ${genderShort}`}
              bg={TOKENS.chip.bg}
              border={TOKENS.chip.border}
              textColor={TOKENS.chip.text}
            />

            {/* capacity */}
            <Chip
              label={`Cap: ${cap}`}
              bg={TOKENS.chip.bg}
              border={TOKENS.chip.border}
              textColor={TOKENS.chip.text}
            />

            {/* membership */}
            <Chip
              label={member.label}
              bg={member.bg}
              border={member.border}
              textColor={member.text}
              weight="800"
            />
          </View>
        </View>

        {/* Edit button */}
        {isCreator && onPressEdit ? (
          <Pressable
            onPress={(event: any) => {
              event?.stopPropagation?.();
              onPressEdit();
            }}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: TOKENS.card.border,
              backgroundColor: "#FFFFFF",
              alignSelf: "flex-start",

              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
            }}
          >
            <Text style={{ fontWeight: "800", color: TOKENS.card.text }}>
              Edit
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Footer hint */}
      <View style={{ marginTop: 10 }}>
        <Text style={{ fontSize: 11, color: TOKENS.card.subtext }}>
          {isJoining ? "Working..." : isCreator ? "You’re the host" : " "}
        </Text>
      </View>
    </Pressable>
  );
}
