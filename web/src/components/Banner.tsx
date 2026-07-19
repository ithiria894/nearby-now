import type { ReactNode } from "react";
import { CategoryIcon } from "./icons";
import { categoryByKey, type CategoryKey } from "@/lib/categories";
import s from "./Banner.module.css";

// Category banner (WEB_PLAN §3.3 v2) — the visual identity of an event.
// Layers, bottom → top: category tint → icon watermark → photo
// (/banners/<key>.jpg|png, missing files fail silently) → label chip
// (bottom-left) + optional overlay slots: `corner` (bottom-right — the vibe
// pill lives here) and `topRight` (host crown etc.).
export function Banner({
  category,
  src,
  height = 84,
  radius,
  edge = "top",
  corner,
  topRight,
}: {
  category: CategoryKey | string;
  src?: string;
  height?: number;
  radius?: string;
  edge?: "top" | "bottom"; // which end of the card the banner sits on
  corner?: ReactNode;
  topRight?: ReactNode;
}) {
  const cat = categoryByKey(category);
  const photo = src
    ? `url(${src})`
    : `url(/banners/${cat.key}.jpg), url(/banners/${cat.key}.png)`;
  const resolvedRadius =
    radius ??
    (edge === "top"
      ? "var(--radius-lg) var(--radius-lg) 0 0"
      : "0 0 var(--radius-lg) var(--radius-lg)");
  return (
    <div
      className={`${s.banner} ${edge === "bottom" ? s.edgeBottom : ""}`}
      style={{
        height,
        borderRadius: resolvedRadius,
        background: `color-mix(in srgb, ${cat.tint} 34%, var(--surface))`,
      }}
    >
      <span className={s.watermark} aria-hidden>
        <CategoryIcon category={cat.key} size={Math.round(height * 0.9)} />
      </span>
      <div className={s.photo} style={{ backgroundImage: photo }} aria-hidden />
      <span className={`t-label ${s.label}`}>{cat.label}</span>
      {corner ? <span className={s.corner}>{corner}</span> : null}
      {topRight ? <span className={s.topRight}>{topRight}</span> : null}
    </div>
  );
}
