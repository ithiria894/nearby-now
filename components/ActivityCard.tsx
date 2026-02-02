import React, { useMemo, useRef, useState } from "react";
import { Alert, Animated, Modal, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useT } from "../lib/i18n/useT";
import { formatCapacity, formatExpiryLabel } from "../lib/i18n/i18n_format";
import { useTheme } from "../src/ui/theme/ThemeProvider";

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

  // Optional (frontend-only; backend can add later)
  creator_display_name?: string | null;
  distance_km?: number | null;
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
 * Helpers
 * ======================= */
function timeLeftLabel(t: (key: string) => string, expiresAt: string | null) {
  const nowMs = Date.now();
  const label = formatExpiryLabel(expiresAt, nowMs, t);

  if (!expiresAt) return { label };

  const ts = new Date(expiresAt).getTime();
  if (!Number.isFinite(ts)) {
    return { label: t("common.unknown") };
  }

  const ms = ts - nowMs;
  if (ms <= 0) return { label };

  const mins = Math.floor(ms / 60000);
  if (mins < 15) return { label };
  if (mins < 60) return { label };
  return { label };
}

function relativeCreatedAt(
  t: (key: string, opts?: any) => string,
  createdAt?: string | null
) {
  if (!createdAt) return t("activityCard.time_now");
  const ts = new Date(createdAt).getTime();
  if (!Number.isFinite(ts)) return t("common.unknown");
  const diff = Date.now() - ts;
  if (diff < 60 * 1000) return t("activityCard.time_now");
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return t("activityCard.time_m", { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("activityCard.time_h", { count: hours });
  const days = Math.floor(hours / 24);
  if (days === 1) return t("activityCard.time_yesterday");
  return t("activityCard.time_d", { count: days });
}

function inferActivityIcon(activity: ActivityCardActivity) {
  const hay = [activity.title_text, activity.place_name, activity.place_text]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const match = (list: string[]) => list.some((k) => hay.includes(k));

  if (match(["karaoke", "ktv", "唱k"])) return "🎤";
  if (match(["boardgame", "board game", "桌遊", "狼人殺"])) return "🎲";
  if (match(["badminton", "羽毛球"])) return "🏸";
  if (match(["hotpot", "hot pot", "火鍋"])) return "🍲";
  if (match(["coffee", "cafe", "咖啡"])) return "☕️";
  if (match(["movie", "電影", "cinema", "film"])) return "🎬";

  return "🎯";
}

function buildPostHint(
  t: (key: string, opts?: any) => string,
  activity: ActivityCardActivity,
  timeLabel: string
) {
  const sentences: string[] = [];
  const place = (activity.place_name ?? activity.place_text ?? "").trim();

  if (place) {
    sentences.push(t("activityCard.hint_place", { place }));
  }

  if (activity.expires_at) {
    sentences.push(t("activityCard.hint_expiry", { when: timeLabel }));
  }

  if (activity.capacity !== null && activity.capacity !== undefined) {
    sentences.push(
      t("activityCard.hint_capacity", {
        count: formatCapacity(activity.capacity, t),
      })
    );
  }

  if (activity.distance_km != null) {
    sentences.push(
      t("activityCard.hint_distance", {
        km: activity.distance_km.toFixed(1),
      })
    );
  }

  if (sentences.length === 0) return null;
  return sentences.slice(0, 2).join(" ");
}

function MenuItem({
  label,
  onPress,
  destructive,
  tokens,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  tokens: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 16,
        paddingVertical: 14,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "800",
          color: destructive ? tokens.dangerText : tokens.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* =======================
 * Component
 * ======================= */
export default function ActivityCard({
  activity: a,
  currentUserId,
  membershipState,
  isJoining,
  onPressCard,
  onPressEdit,
}: Props) {
  const { t } = useT();
  const theme = useTheme();
  const TOKENS = theme.colors;

  const isCreator = !!currentUserId && a.creator_id === currentUserId;
  const cardBorder = theme.isDark ? TOKENS.border : "#D6E6C8";
  const cardBg = theme.isDark ? TOKENS.surface : "#F6F9F2";
  const iconBg = theme.isDark ? TOKENS.surfaceAlt : "#E6F1DE";
  const accent = theme.isDark ? TOKENS.text : "#4F7E40";

  const time = useMemo(() => timeLeftLabel(t, a.expires_at), [a.expires_at, t]);
  const icon = useMemo(() => inferActivityIcon(a), [a]);
  const postedLabel = useMemo(
    () => relativeCreatedAt(t, a.created_at),
    [a.created_at, t]
  );
  const hintText = useMemo(
    () => buildPostHint(t, a, time.label),
    [a, t, time.label]
  );
  const showHint = !!hintText;

  const ctaText =
    membershipState === "joined"
      ? t("activityCard.cta_link_joined")
      : membershipState === "left"
        ? t("activityCard.cta_link_left")
        : t("activityCard.cta_link_default");
  const showHostLabel = isCreator;

  const [menuOpen, setMenuOpen] = useState(false);
  const didLongPressRef = useRef(false);
  const pressAnim = useRef(new Animated.Value(0)).current;

  const pressedBg = theme.isDark ? "#161B22" : "#EAF4E2";
  const animatedStyle = {
    transform: [
      {
        scale: pressAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.985],
        }),
      },
    ],
    shadowOpacity: pressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.08, 0.14],
    }),
    shadowRadius: pressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [10, 14],
    }),
    elevation: pressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 3],
    }),
    backgroundColor: pressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [cardBg, pressedBg],
    }),
  };

  function notImplemented(action: "share" | "report" | "delete") {
    const titleKey = `activityCard.notImplementedTitle_${action}` as const;
    Alert.alert(t(titleKey), t("activityCard.notImplementedBody"));
  }

  function runAction(action: "edit" | "share" | "report" | "delete") {
    setMenuOpen(false);

    if (action === "edit") {
      if (!isCreator) return;
      onPressEdit?.();
      return;
    }
    if (action === "share") return notImplemented("share");
    if (action === "report") return notImplemented("report");
    if (action === "delete") return notImplemented("delete");
  }

  return (
    <>
      <Pressable
        onPress={() => {
          if (didLongPressRef.current) {
            didLongPressRef.current = false;
            return;
          }
          onPressCard();
        }}
        onLongPress={() => {
          didLongPressRef.current = true;
          setMenuOpen(true);
        }}
        delayLongPress={280}
        disabled={isJoining}
        onPressIn={() => {
          Animated.spring(pressAnim, {
            toValue: 1,
            useNativeDriver: false,
            speed: 20,
            bounciness: 0,
          }).start();
        }}
        onPressOut={() => {
          Animated.spring(pressAnim, {
            toValue: 0,
            useNativeDriver: false,
            speed: 20,
            bounciness: 0,
          }).start(() => {
            didLongPressRef.current = false;
          });
        }}
        style={({ pressed }) => ({
          opacity: isJoining ? 0.55 : pressed ? 0.98 : 1,
        })}
      >
        <Animated.View
          style={{
            width: "100%",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: cardBorder,
            padding: 14,
            gap: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            ...animatedStyle,
          }}
        >
          <Text
            style={{
              position: "absolute",
              top: 10,
              right: 12,
              fontSize: 11.5,
              fontWeight: "700",
              color: TOKENS.subtext,
            }}
          >
            {postedLabel}
          </Text>

          <View
            style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: cardBorder,
                backgroundColor: iconBg,
              }}
            >
              <Text style={{ fontSize: 18 }}>{icon}</Text>
            </View>

            <View style={{ flex: 1, paddingRight: 36 }}>
              <Text
                numberOfLines={5}
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  lineHeight: 23,
                  color: TOKENS.text,
                }}
              >
                {a.title_text}
              </Text>

              <View style={{ gap: 6, paddingTop: showHint ? 10 : 8 }}>
                {showHint ? (
                  <>
                    <View
                      style={{
                        height: 1,
                        backgroundColor: cardBorder,
                        opacity: theme.isDark ? 0.45 : 0.7,
                        marginBottom: 2,
                      }}
                    />
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: TOKENS.subtext,
                      }}
                    >
                      {hintText}
                    </Text>
                  </>
                ) : null}

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {showHostLabel ? (
                    <Text
                      style={{
                        fontSize: 11.5,
                        fontWeight: "700",
                        color: TOKENS.subtext,
                      }}
                    >
                      {t("activityCard.host_tag")}
                    </Text>
                  ) : null}
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      onPressCard();
                    }}
                    hitSlop={12}
                    style={{ marginLeft: "auto" }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Ionicons name="people" size={12} color={accent} />
                      <Text
                        style={{
                          fontSize: 12.5,
                          fontWeight: "800",
                          color: accent,
                        }}
                      >
                        {ctaText} →
                      </Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      </Pressable>

      {/* Menu modal */}
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
                backgroundColor: TOKENS.border,
                marginBottom: 10,
              }}
            />

            {isCreator ? (
              <>
                <MenuItem
                  label={t("activityCard.menu.edit")}
                  onPress={() => runAction("edit")}
                  tokens={TOKENS}
                />
                <MenuItem
                  label={t("activityCard.menu.delete")}
                  destructive
                  onPress={() => runAction("delete")}
                  tokens={TOKENS}
                />
              </>
            ) : null}

            <MenuItem
              label={t("activityCard.menu.share")}
              onPress={() => runAction("share")}
              tokens={TOKENS}
            />
            <MenuItem
              label={t("activityCard.menu.report")}
              onPress={() => runAction("report")}
              tokens={TOKENS}
            />

            <View style={{ height: 8 }} />
            <MenuItem
              label={t("activityCard.menu.cancel")}
              onPress={() => setMenuOpen(false)}
              tokens={TOKENS}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
