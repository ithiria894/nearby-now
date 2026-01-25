import { Pressable, Text, View } from "react-native";

export type ActivityCardActivity = {
  id: string;
  creator_id: string;
  title_text: string;
  place_text: string | null;
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

function formatTimeLeft(expiresAtIso: string | null): string {
  if (!expiresAtIso) return "never";
  const ms = new Date(expiresAtIso).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}

function computeStatusLabel(a: ActivityCardActivity): string | null {
  if (a.status && a.status !== "open") return "closed";
  if (a.expires_at) {
    const ms = new Date(a.expires_at).getTime() - Date.now();
    if (ms <= 0) return "expired";
  }
  return null;
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
  // :zap: CHANGE 2: membership-aware helper text.
  const helperText =
    membershipState === "joined"
      ? "You joined"
      : membershipState === "left"
        ? "You left"
        : "Tap to join";

  return (
    <Pressable
      onPress={onPressCard}
      disabled={isJoining}
      style={{
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        opacity: isJoining ? 0.6 : 1,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", flex: 1 }}>
              {a.title_text}
            </Text>

            {statusLabel ? (
              <View
                style={{
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "800" }}>
                  {statusLabel}
                </Text>
              </View>
            ) : null}
          </View>

          <Text>
            {a.place_text ? a.place_text : "No place"} • expires{" "}
            {formatTimeLeft(a.expires_at)}
          </Text>

          <Text>
            gender: {a.gender_pref} • capacity: {a.capacity ?? "unlimited"}
          </Text>

          <Text style={{ opacity: 0.7 }}>{helperText}</Text>
        </View>

        {isCreator && onPressEdit ? (
          <Pressable
            onPress={(event: any) => {
              event?.stopPropagation?.();
              onPressEdit();
            }}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: 10,
              borderWidth: 1,
              alignSelf: "flex-start",
            }}
          >
            <Text style={{ fontWeight: "700" }}>Edit</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}
