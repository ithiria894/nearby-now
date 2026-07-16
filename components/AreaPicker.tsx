import React, { type ReactNode } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useT } from "../lib/i18n/useT";
import type { PlaceCandidate } from "../lib/api/places";
import type { AreaLocation } from "../lib/ui/location";
import type { UIColors } from "../src/ui/theme/uikit";
import { borders, radius, space } from "../src/ui/theme/uikit";
import { BText } from "../src/ui/components/brutal";

export type AreaPickerProps = {
  c: UIColors;
  /** Optional context line under the title (only shown when showTitle). */
  subtitle?: string;
  currentLabel: string | null;
  currentApprox?: boolean;
  detecting?: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  results: PlaceCandidate[];
  searching: boolean;
  recentAreas: AreaLocation[];
  /** Selection callbacks. The picker calls onDone() afterwards. */
  onLocate: () => void | Promise<unknown>;
  onPickPlace: (place: PlaceCandidate) => void;
  onPickRecent: (area: AreaLocation) => void;
  /** Feed-only radius controls, rendered under the search field. */
  radiusSlot?: ReactNode;
  /** Render the "Choose your area" heading (true inside the sheet). */
  showTitle?: boolean;
  /** Fired after any selection — the sheet dismisses; inline can advance/no-op. */
  onDone?: () => void;
  /** Input component (AreaSheet passes a BottomSheetTextInput on native). */
  Input?: typeof TextInput;
};

/**
 * The location picker body: a single search field that doubles as a
 * "use my location" control (the ◎ button, which becomes a clear button while
 * typing). Empty query → current area + recents; typing → live results.
 * Rendered inline (Compose/Edit) or inside a bottom sheet (AreaSheet/Feed).
 */
export function AreaPicker({
  c,
  subtitle,
  currentLabel,
  currentApprox,
  detecting,
  query,
  onQueryChange,
  results,
  searching,
  recentAreas,
  onLocate,
  onPickPlace,
  onPickRecent,
  radiusSlot,
  showTitle,
  onDone,
  Input = TextInput,
}: AreaPickerProps) {
  const { t } = useT();
  const typing = query.trim().length > 0;
  const recents = recentAreas.filter((a) => a.label !== currentLabel);

  const rowStyle = (pressed: boolean) => ({
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: borders.thick,
    borderColor: c.border,
    backgroundColor: pressed ? c.surfaceAlt : c.surface,
  });

  return (
    <View style={{ gap: space.md }}>
      {showTitle ? (
        <View style={{ gap: space.xs }}>
          <BText c={c} v="h2" color={c.ink}>
            {t("browse.area_sheet_title")}
          </BText>
          {subtitle ? (
            <BText c={c} v="caption" color={c.subtext}>
              {subtitle}
            </BText>
          ) : null}
        </View>
      ) : null}

      {/* Single field: search a place, or tap ◎ to use my location. */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: space.sm,
          paddingHorizontal: space.md,
          paddingVertical: space.sm,
          borderRadius: radius.md,
          borderWidth: borders.thick,
          borderColor: c.border,
          backgroundColor: c.surfaceAlt,
        }}
      >
        <Ionicons name="search" size={17} color={c.subtext} />
        <Input
          value={query}
          onChangeText={onQueryChange}
          placeholder={t("browse.area_search_placeholder")}
          placeholderTextColor={c.faint}
          returnKeyType="search"
          style={{ flex: 1, fontSize: 15, color: c.text }}
        />
        {typing ? (
          <Pressable
            onPress={() => onQueryChange("")}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("common.clear")}
            style={{ padding: 2 }}
          >
            <Ionicons name="close-circle" size={20} color={c.subtext} />
          </Pressable>
        ) : (
          <Pressable
            onPress={async () => {
              await onLocate();
              onDone?.();
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("browse.area_use_current")}
            style={({ pressed }) => ({
              width: 30,
              height: 30,
              borderRadius: radius.pill,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? c.surface : "transparent",
            })}
          >
            <Ionicons
              name={detecting ? "sync" : "locate"}
              size={19}
              color={c.brand}
            />
          </Pressable>
        )}
      </View>

      {radiusSlot}

      {typing ? (
        <View style={{ gap: space.sm }}>
          {searching ? (
            <BText c={c} v="caption" color={c.subtext}>
              {t("browse.area_searching")}
            </BText>
          ) : results.length === 0 ? (
            <BText c={c} v="caption" color={c.subtext}>
              {t("browse.area_no_results")}
            </BText>
          ) : (
            results.map((place) => (
              <Pressable
                key={place.placeId}
                onPress={() => {
                  onPickPlace(place);
                  onQueryChange("");
                  onDone?.();
                }}
                style={({ pressed }) => rowStyle(pressed)}
              >
                <Ionicons name="location" size={18} color={c.subtext} />
                <View style={{ flex: 1 }}>
                  <BText c={c} v="title" color={c.ink} numberOfLines={1}>
                    {place.name}
                  </BText>
                  <BText c={c} v="caption" color={c.subtext} numberOfLines={1}>
                    {place.address}
                  </BText>
                </View>
              </Pressable>
            ))
          )}
        </View>
      ) : (
        <>
          {currentLabel ? (
            <View style={{ gap: space.sm }}>
              <BText c={c} v="label" color={c.subtext}>
                {t("browse.area_current")}
              </BText>
              <Pressable
                onPress={() => onDone?.()}
                style={({ pressed }) => rowStyle(pressed)}
              >
                <Ionicons name="location" size={18} color={c.brand} />
                <BText c={c} v="title" color={c.ink} numberOfLines={1}>
                  {detecting ? t("browse.area_detecting") : currentLabel}
                </BText>
                {currentApprox ? (
                  <BText c={c} v="caption" color={c.faint}>
                    {t("browse.area_approx")}
                  </BText>
                ) : null}
                <View style={{ flex: 1 }} />
                <Ionicons name="checkmark" size={18} color={c.brand} />
              </Pressable>
            </View>
          ) : null}

          {recents.length > 0 ? (
            <View style={{ gap: space.sm }}>
              <BText c={c} v="label" color={c.subtext}>
                {t("browse.area_recent")}
              </BText>
              {recents.map((area) => (
                <Pressable
                  key={`${area.label}-${area.lat}-${area.lng}`}
                  onPress={() => {
                    onPickRecent(area);
                    onDone?.();
                  }}
                  style={({ pressed }) => rowStyle(pressed)}
                >
                  <Ionicons name="time-outline" size={18} color={c.subtext} />
                  <BText c={c} v="title" color={c.ink} numberOfLines={1}>
                    {area.label}
                  </BText>
                </Pressable>
              ))}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}
