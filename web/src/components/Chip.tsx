import type { CSSProperties, ReactNode } from "react";
import s from "./Chip.module.css";

export type ChipTone = "neutral" | "brand" | "success" | "danger" | "warn";

type Props = {
  tone?: ChipTone;
  selected?: boolean;
  accent?: string; // neutral-selected hue (e.g. a vibe tint "var(--sky)")
  leading?: ReactNode; // glyph/icon
  onClick?: () => void; // present → pressable button; absent → static span
  children: ReactNode;
};

// Chip — BChip port. Neutral + accent = a vibe/filter chip; other tones are
// loud fills. Portable client React.
export function Chip({
  tone = "neutral",
  selected,
  accent,
  leading,
  onClick,
  children,
}: Props) {
  const toneCls = tone === "neutral" ? (selected ? s.selected : "") : s[tone];
  const cls = [s.chip, toneCls, onClick ? s.pressable : ""]
    .filter(Boolean)
    .join(" ");
  const style = accent
    ? ({ "--chip-accent": accent } as CSSProperties)
    : undefined;
  const inner = (
    <>
      {leading ? <span className={s.glyph}>{leading}</span> : null}
      {children}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={cls}
        style={style}
        aria-pressed={tone === "neutral" ? !!selected : undefined}
        onClick={onClick}
      >
        {inner}
      </button>
    );
  }
  return (
    <span className={cls} style={style}>
      {inner}
    </span>
  );
}
