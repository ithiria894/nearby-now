import type { ButtonHTMLAttributes, ReactNode } from "react";
import s from "./Button.module.css";

export type ButtonTone = "primary" | "secondary" | "accent" | "danger";

type Props = {
  tone?: ButtonTone;
  full?: boolean;
  loading?: boolean;
  leading?: ReactNode; // optional leading glyph/icon
} & ButtonHTMLAttributes<HTMLButtonElement>;

// Button — soft-brutalist, presses into its hard shadow (see Button.module.css).
// Portable client React (no next/*). Mirrors brutal.tsx BButton tones.
export function Button({
  tone = "primary",
  full,
  loading,
  leading,
  disabled,
  children,
  className,
  ...rest
}: Props) {
  const cls = [s.btn, s[tone], full ? s.full : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      className={cls}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className={s.spinner} aria-hidden /> : leading}
      {children}
    </button>
  );
}
