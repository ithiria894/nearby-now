import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { alertAsync } from "../lib/ui/dialog";
import { backend } from "../lib/backend";
import { requireUserId } from "../lib/domain/auth";
import type { ActivityCardActivity } from "../lib/domain/activities";
import InviteForm, { type InviteFormPayload } from "../components/InviteForm";
import { useT } from "../lib/i18n/useT";
import { useUIKit } from "../src/ui/theme/useUIKit";
import { radius, space } from "../src/ui/theme/uikit";
import { BAppBar, BButton, BScreen, BText } from "../src/ui/components/brutal";

// A previous invite's config, reused as a template for a new (empty) room.
type Template = {
  title_text?: string;
  place_text?: string | null;
  place_name?: string | null;
  place_address?: string | null;
  lat?: number | null;
  lng?: number | null;
  gender_pref?: "any" | "female" | "male" | null;
  capacity?: number | null;
  start_time?: string | null;
  end_time?: string | null;
};

export default function CreateScreen() {
  const router = useRouter();
  const { t } = useT();
  const c = useUIKit();
  const [submitting, setSubmitting] = useState(false);
  const createdActivityIdRef = useRef<string | null>(null);

  // "Reuse a past invite's config" — pick one of your own past invites to
  // pre-fill this form (opens a NEW empty room with the same settings).
  const [pastInvites, setPastInvites] = useState<ActivityCardActivity[]>([]);
  const [template, setTemplate] = useState<Template | undefined>(undefined);
  const [templateKey, setTemplateKey] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const userId = await requireUserId();
        const { data } = await backend.activities.fetchCreatedActivities(
          userId,
          20
        );
        if (alive) setPastInvites(data ?? []);
      } catch {
        // best-effort; the reuse feature just won't show if this fails
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  function applyTemplate(a: ActivityCardActivity) {
    // Reuse the config, NOT the old expiry — the new room gets a fresh lifetime.
    setTemplate({
      title_text: a.title_text ?? "",
      place_text: a.place_text ?? null,
      place_name: a.place_name ?? null,
      place_address: a.place_address ?? null,
      lat: a.lat ?? null,
      lng: a.lng ?? null,
      gender_pref:
        a.gender_pref === "female" || a.gender_pref === "male"
          ? a.gender_pref
          : "any",
      capacity: a.capacity ?? null,
      start_time: a.start_time ?? null,
      end_time: a.end_time ?? null,
    });
    setTemplateKey((k) => k + 1); // remount InviteForm so it re-inits pre-filled
    setPickerOpen(false);
  }

  async function onCreate(payload: InviteFormPayload) {
    setSubmitting(true);
    try {
      const userId = await requireUserId();

      let activityId = createdActivityIdRef.current;
      if (!activityId) {
        const insertPayload: any = {
          creator_id: userId,
          title_text: payload.title_text,
          place_text: payload.place_text,
          place_name: payload.place_name,
          place_address: payload.place_address,
          lat: payload.lat,
          lng: payload.lng,
          place_id: payload.place_id,
          location_source: payload.location_source,
          gender_pref: payload.gender_pref,
          capacity: payload.capacity,
          start_time: payload.start_time,
          end_time: payload.end_time,
          status: "open",
        };

        if (payload.expires_at !== undefined) {
          insertPayload.expires_at = payload.expires_at;
        }

        const { data, error } =
          await backend.activities.createActivity(insertPayload);

        if (error) throw error;

        // :zap: CHANGE 1: Remember the created activity id so a failed auto-join
        // below does not create a duplicate activity when the user re-taps Post.
        activityId = data.id;
        createdActivityIdRef.current = activityId;
      }

      // Auto-join creator as member
      const { error: joinErr } = await backend.activities.upsertActivityMember({
        activity_id: activityId,
        user_id: userId,
        role: "creator",
        state: "joined",
      });

      if (joinErr) throw joinErr;

      // :zap: CHANGE 2: Create -> go back to Created tab
      createdActivityIdRef.current = null;
      router.replace("/(tabs)/created");
    } catch (_e: any) {
      console.error(_e);
      alertAsync(t("create.errorTitle"), _e?.message ?? "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BScreen
      c={c}
      scroll
      appBar={
        <BAppBar
          c={c}
          onBack={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/(tabs)/browse")
          }
          title={t("create.title")}
        />
      }
    >
      {pastInvites.length > 0 ? (
        <BButton
          c={c}
          tone="secondary"
          full
          icon="history"
          label={t("create.reuse")}
          onPress={() => setPickerOpen(true)}
        />
      ) : null}

      <InviteForm
        key={templateKey}
        mode="create"
        submitting={submitting}
        submitLabel={t("create.submit")}
        onSubmit={onCreate}
        initialValues={template}
      />

      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: c.overlay,
            justifyContent: "flex-end",
          }}
          onPress={() => setPickerOpen(false)}
        >
          <Pressable
            style={{
              backgroundColor: c.bg,
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
              borderWidth: 2,
              borderColor: c.border,
              padding: space.lg,
              maxHeight: "70%",
            }}
            onPress={() => {}}
          >
            <BText
              v="h2"
              c={c}
              color={c.ink}
              style={{ marginBottom: space.md }}
            >
              {t("create.reuseTitle")}
            </BText>
            <ScrollView style={{ maxHeight: 420 }}>
              {pastInvites.map((a) => (
                <Pressable
                  key={a.id}
                  onPress={() => applyTemplate(a)}
                  style={{
                    paddingVertical: space.md,
                    borderBottomWidth: 1,
                    borderBottomColor: c.border,
                  }}
                >
                  <BText v="bodyStrong" c={c} color={c.ink} numberOfLines={1}>
                    {a.title_text || t("common.unknown")}
                  </BText>
                  {a.place_name || a.place_text ? (
                    <BText
                      v="caption"
                      c={c}
                      color={c.subtext}
                      numberOfLines={1}
                    >
                      {a.place_name || a.place_text}
                    </BText>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
            <View style={{ marginTop: space.md }}>
              <BButton
                c={c}
                tone="secondary"
                full
                label={t("create.reuseClose")}
                onPress={() => setPickerOpen(false)}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </BScreen>
  );
}
