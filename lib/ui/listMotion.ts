// Shared list-motion helpers so every feed-style list animates identically:
// a spring pop-in the first time a row is seen, and a layout spring when rows
// sort or change position. Values come from the design-system motion tokens.
import { useRef } from "react";
import { FadeInDown, LinearTransition } from "react-native-reanimated";
import { motion } from "../../src/ui/theme/uikit";

// Re-flow transition for reordered rows (pass to Animated.FlatList's
// itemLayoutAnimation, or a row's `layout` prop). Uses the crisp M3 spatial
// spring (see .docs/M3_ADOPTION_GUIDE.md §B1) — tight, no floaty settle.
export const listLayout = LinearTransition.springify()
  .damping(motion.springSpatial.damping)
  .stiffness(motion.springSpatial.stiffness)
  .mass(motion.springSpatial.mass);

// Spring entrance for a row at a given index; staggered on first load and
// capped so items deep in the list don't wait too long.
export function rowEntering(index: number) {
  return FadeInDown.springify()
    .damping(motion.springSpatial.damping)
    .stiffness(motion.springSpatial.stiffness)
    .mass(motion.springSpatial.mass)
    .delay(Math.min(index, 8) * motion.stagger);
}

// Returns a marker: call it with a row id; true the FIRST time that id is seen
// (first load / a genuinely new row), false afterwards — so scroll-recycled or
// merely re-sorted rows don't re-run their entrance (reorders use listLayout).
export function useSeenRows() {
  const seen = useRef<Set<string>>(new Set());
  return (id: string) => {
    if (seen.current.has(id)) return false;
    seen.current.add(id);
    return true;
  };
}
