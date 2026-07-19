import type { HTMLAttributes, ReactNode } from "react";
import s from "./Badge.module.css";

type Props = {
  fill?: string; // bright accent fill (a token var, e.g. "var(--mint)")
  color?: string; // text/icon color (defaults to --on-bright)
  bleed?: boolean; // same-color hard shadow "bleeds" out behind the badge
  leading?: ReactNode;
} & HTMLAttributes<HTMLSpanElement>;

// Badge — BBadge port. `bleed` casts a hard offset shadow in the fill color.
export function Badge({
  fill = "var(--mint)",
  color,
  bleed,
  leading,
  children,
  className,
  style,
  ...rest
}: Props) {
  return (
    <span
      className={[s.badge, className].filter(Boolean).join(" ")}
      style={{
        background: fill,
        color,
        boxShadow: bleed ? `3px 3px 0 ${fill}` : undefined,
        ...style,
      }}
      {...rest}
    >
      {leading}
      {children}
    </span>
  );
}
