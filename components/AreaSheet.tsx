import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ReactNode,
} from "react";
import { Platform, TextInput } from "react-native";
import {
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";

import type { PlaceCandidate } from "../lib/api/places";
import type { AreaLocation } from "../lib/ui/location";
import type { UIColors } from "../src/ui/theme/uikit";
import { radius, space } from "../src/ui/theme/uikit";
import { AreaPicker } from "./AreaPicker";

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
  subtitle: string;
  currentLabel: string | null;
  currentApprox?: boolean;
  detecting?: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  results: PlaceCandidate[];
  searching: boolean;
  recentAreas: AreaLocation[];
  onLocate: () => void | Promise<unknown>;
  onPickPlace: (place: PlaceCandidate) => void;
  onPickRecent: (area: AreaLocation) => void;
  radiusSlot?: ReactNode;
};

/**
 * Bottom-sheet wrapper around <AreaPicker> — used by the Feed's location pill.
 * Compose/Edit embed AreaPicker inline instead (no sheet).
 */
export const AreaSheet = forwardRef<AreaSheetHandle, AreaSheetProps>(
  function AreaSheet(props, ref) {
    const {
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
    } = props;
    const sheetRef = useRef<BottomSheetModal>(null);
    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
      dismiss: () => sheetRef.current?.dismiss(),
    }));

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
          style={{ padding: space.lg, paddingBottom: space.lg + bottomInset }}
        >
          <AreaPicker
            c={c}
            subtitle={subtitle}
            currentLabel={currentLabel}
            currentApprox={currentApprox}
            detecting={detecting}
            query={query}
            onQueryChange={onQueryChange}
            results={results}
            searching={searching}
            recentAreas={recentAreas}
            onLocate={onLocate}
            onPickPlace={onPickPlace}
            onPickRecent={onPickRecent}
            radiusSlot={radiusSlot}
            showTitle
            onDone={() => sheetRef.current?.dismiss()}
            Input={SheetInput}
          />
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);
