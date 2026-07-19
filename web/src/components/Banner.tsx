import { CategoryIcon } from "./icons";
import { categoryByKey, type CategoryKey } from "@/lib/categories";
import s from "./Banner.module.css";

// Category banner (WEB_PLAN §3.3 v2) — the visual identity of an event.
// Layers, bottom → top:
//   1. category tint (always)
//   2. icon watermark (the asset-free look)
//   3. photo — the curated AI set at /banners/<key>.jpg (see
//      public/banners/README.md). Rendered as a CSS background so a missing
//      file fails SILENTLY and layers 1–2 show through. Phase-2 creator
//      uploads pass `src` and flow through the same layer.
//   4. label chip on paper (readable on any photo).
export function Banner({
  category,
  src,
  height = 84,
  radius = "var(--radius-lg) var(--radius-lg) 0 0",
}: {
  category: CategoryKey | string;
  src?: string; // override photo (phase-2 `img:` banners)
  height?: number;
  radius?: string;
}) {
  const cat = categoryByKey(category);
  const photo = src ?? `/banners/${cat.key}.jpg`;
  return (
    <div
      className={s.banner}
      style={{
        height,
        borderRadius: radius,
        background: `color-mix(in srgb, ${cat.tint} 34%, var(--surface))`,
      }}
    >
      <span className={s.watermark} aria-hidden>
        <CategoryIcon category={cat.key} size={Math.round(height * 0.9)} />
      </span>
      <div
        className={s.photo}
        style={{ backgroundImage: `url(${photo})` }}
        aria-hidden
      />
      <span className={`t-label ${s.label}`}>{cat.label}</span>
    </div>
  );
}
