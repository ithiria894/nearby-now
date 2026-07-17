import { View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useT } from "../lib/i18n/useT";
import { BActivityRow } from "../src/ui/components/brutal";
import type { UIColors } from "../src/ui/theme/uikit";
import type { ActivityCardActivity } from "../lib/domain/activities";
import type { RoomSummary } from "../lib/repo/room_summaries";
import { renderEventContent } from "../lib/domain/room";
import {
  formatExpiryLabel,
  formatMessageTimestamp,
} from "../lib/i18n/i18n_format";
import { activityIcon, activityTileColor } from "../lib/ui/activityIcon";

const tilePalette = (c: UIColors) => [
  c.coral,
  c.mint,
  c.sky,
  c.yellow,
  c.grape,
  c.pink,
];

/**
 * A lobby/created list row rendered as a conversation: last-message preview +
 * time, a member count, and an unread badge. Wraps BActivityRow so both the
 * Lobby and Created screens stay in sync.
 */
export function ConversationRow({
  c,
  activity,
  summary,
  userId,
  isHost,
  onPress,
}: {
  c: UIColors;
  activity: ActivityCardActivity;
  summary?: RoomSummary;
  userId: string | null;
  isHost?: boolean; // you created this room → show a gold host crown on the tile
  onPress: () => void;
}) {
  const { t, i18n } = useT();
  const now = Date.now();

  const lm = summary?.lastMessage ?? null;
  // Dim previews that aren't real typed chat — system events ("… joined the
  // lobby"), quick pings ("I'm here"), and the empty-room placeholder all read
  // as secondary, so only an actual message stands out.
  const previewMuted =
    !lm || lm.event.type === "system" || lm.event.type === "quick";
  let preview: string;
  if (!lm) {
    preview = t("activityCard.no_messages");
  } else {
    const text = renderEventContent(t, i18n.language, lm.event);
    if (lm.event.type === "system") {
      preview = text; // system text already names the actor
    } else {
      const who =
        lm.senderId && lm.senderId === userId
          ? t("room.you")
          : lm.senderName?.trim() || t("room.unknownUser");
      preview = `${who}: ${text}`;
    }
  }

  const trailing = lm
    ? formatMessageTimestamp(lm.event.created_at, now, t, i18n.language)
    : undefined;

  const members =
    typeof activity.joined_count === "number" ? activity.joined_count : 0;
  const closes = formatExpiryLabel(activity.expires_at, now, t);
  const meta = (
    <>
      <MaterialCommunityIcons
        name="account-multiple"
        size={13}
        color={c.subtext}
      />
      {` ${members} · ${closes}`}
    </>
  );

  // Gold crown pip on the icon tile when you're the host of this room.
  const hostBadge = isHost ? (
    <View
      style={{
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: c.yellow,
        borderWidth: 1.5,
        borderColor: c.border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <MaterialCommunityIcons name="crown" size={10} color={c.onBright} />
    </View>
  ) : undefined;

  return (
    <BActivityRow
      c={c}
      icon={activityIcon(activity.title_text)}
      iconBg={activityTileColor(activity.id, tilePalette(c))}
      iconBadge={hostBadge}
      title={activity.title_text}
      trailing={trailing}
      preview={preview}
      previewMuted={previewMuted}
      meta={meta}
      unread={summary?.unreadCount ?? 0}
      onPress={onPress}
    />
  );
}
