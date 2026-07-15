import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ReactNode,
} from "react";
import { Platform, Pressable, TextInput, View } from "react-native";
import {
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";

import { useT } from "../lib/i18n/useT";
import type { PlaceCandidate } from "../lib/api/places";
import type { AreaLocation } from "../lib/ui/location";
import type { UIColors } from "../src/ui/theme/uikit";
import { borders, radius, space } from "../src/ui/theme/uikit";
import { BText } from "../src/ui/components/brutal";

// gorhom's BottomSheetTextInput crashes on react-native-web when the sheet
// unmounts (findNodeHandle on a null scroll ref). It's only needed on native
// for keyboard coordination, so fall back to a plain TextInput on web.
const SheetInput = (
  Platform.OS === "web" ? TextInput : BottomSheetTextInput
) as typeof TextInput;

export type AreaSheetHandle = {
  present: () => void;
  dismiss: () => void;
};

export type AreaSheetProps = {
  c: UIColors;
  bottomInset: number;
  snapPoints: (string | number)[];
  backdropComponent: (props: any) => React.ReactElement | null;
  /** Context line under the title (Feed vs. compose read differently). */
  subtitle: string;
  /** Currently selected area label, or null while none is picked. */
  currentLabel: string | null;
  /** Whether the current area is an approximate (IP) fix. */
  currentApprox?: boolean;
  /** True while a location is being detected. */
  detecting?: boolean;
  // search
  query: string;
  onQueryChange: (value: string) => void;
  results: PlaceCandidate[];
  searching: boolean;
  recentAreas: AreaLocation[];
  // actions — the sheet dismisses itself after each of these fires
  onLocate: () => void | Promise<unknown>;
  onPickPlace: (place: PlaceCandidate) => void;
  onPickRecent: (area: AreaLocation) => void;
  /** Feed-only radius controls, rendered under the search field. */
  radiusSlot?: ReactNode;
};

/**
 * The one location picker shared by Feed and Compose. A single search field
 * doubles as the "use my location" control (the ◎ button, which becomes a
 * clear button while typing), so there's no separate locate button or refresh
 * link. When the query is empty it shows the current area + recent areas; while
 * typing it shows live search results.
 */
export const AreaSheet = forwardRef<AreaSheetHandle, AreaSheetProps>(
  function AreaSheet(
    {
      c,
      bottomInset,
      snapPoints,
      backdropComponent,
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
    },
    ref
  ) {
    const { t } = useT();
    const sheetRef = useRef<BottomSheetModal>(null);
    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const typing = query.trim().length > 0;

    // Recent areas minus whatever is already shown as the current area, so a
    // place doesn't appear twice.
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
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose
        backdropComponent={backdropComponent}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        backgroundStyle={{
          backgroundColor: c.surface,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
        }}
        handleIndicatorStyle={{ backgroundColor: c.border }}
      >
        <BottomSheetView
          style={{
            padding: space.lg,
            paddingBottom: space.lg + bottomInset,
            gap: space.md,
          }}
        >
          <View style={{ gap: space.xs }}>
            <BText c={c} v="h2" color={c.ink}>
              {t("browse.area_sheet_title")}
            </BText>
            <BText c={c} v="caption" color={c.subtext}>
              {subtitle}
            </BText>
          </View>

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
            <SheetInput
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
                  sheetRef.current?.dismiss();
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

          {/* Feed passes radius chips here; compose passes nothing. */}
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
                      sheetRef.current?.dismiss();
                    }}
                    style={({ pressed }) => rowStyle(pressed)}
                  >
                    <Ionicons name="location" size={18} color={c.subtext} />
                    <View style={{ flex: 1 }}>
                      <BText c={c} v="title" color={c.ink} numberOfLines={1}>
                        {place.name}
                      </BText>
                      <BText
                        c={c}
                        v="caption"
                        color={c.subtext}
                        numberOfLines={1}
                      >
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
                    onPress={() => sheetRef.current?.dismiss()}
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
                        sheetRef.current?.dismiss();
                      }}
                      style={({ pressed }) => rowStyle(pressed)}
                    >
                      <Ionicons
                        name="time-outline"
                        size={18}
                        color={c.subtext}
                      />
                      <BText c={c} v="title" color={c.ink} numberOfLines={1}>
                        {area.label}
                      </BText>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);
