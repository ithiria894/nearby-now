import { CategoryIcon } from "./icons";
import { categoryByKey, type CategoryKey } from "@/lib/categories";
import s from "./Banner.module.css";

// Category banner (WEB_PLAN §3.3 v2) — the visual identity of an event.
// Asset-free v1: category tint + oversized icon watermark + label, brutal
// style, theme-aware. Later: `img:` banners (creator uploads, phase 2) render
// through this same component.
export function Banner({
  category,
  height = 84,
  radius = "var(--radius-lg) var(--radius-lg) 0 0",
}: {
  category: CategoryKey | string;
  height?: number;
  radius?: string;
}) {
  const cat = categoryByKey(category);
  return (
    <div
      className={s.banner}
      style={{
        height,
        borderRadius: radius,
        background: `color-mix(in srgb, ${cat.tint} 34%, var(--surface))`,
      }}
    >
      <span className={`t-label ${s.label}`}>{cat.label}</span>
      <span className={s.watermark} aria-hidden>
        <CategoryIcon category={cat.key} size={Math.round(height * 0.9)} />
      </span>
    </div>
  );
}
