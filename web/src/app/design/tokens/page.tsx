import { PaperTexture } from "@/components/PaperTexture";
import s from "../design.module.css";

// /design/tokens — Section 1. Static (server component); PaperTexture is a
// client component rendered inside, which is fine.

const COLORS: { name: string; v: string; light: string; dark: string }[] = [
  { name: "bg", v: "--bg", light: "#F3EBD8", dark: "#1B1710" },
  { name: "surface", v: "--surface", light: "#FFFCF3", dark: "#26211A" },
  {
    name: "surface-alt",
    v: "--surface-alt",
    light: "#EBE1C9",
    dark: "#312B21",
  },
  { name: "ink", v: "--ink", light: "#1C180F", dark: "#F3EBD8" },
  { name: "border", v: "--border", light: "#1C180F", dark: "#8A7C5E" },
  { name: "text", v: "--text", light: "#241F14", dark: "#EFE7D4" },
  { name: "subtext", v: "--subtext", light: "#6E6450", dark: "#B0A68C" },
  { name: "faint", v: "--faint", light: "#9C927A", dark: "#7C7360" },
  { name: "hairline", v: "--hairline", light: "#DBD0B4", dark: "#3A3428" },
  { name: "brand", v: "--brand", light: "#5B4DF0", dark: "#8E80FF" },
  { name: "on-brand", v: "--on-brand", light: "#FFFFFF", dark: "#141019" },
  { name: "yellow", v: "--yellow", light: "#FFC93C", dark: "#FFD65C" },
  { name: "coral", v: "--coral", light: "#FF6B4A", dark: "#FF8A6E" },
  { name: "mint", v: "--mint", light: "#2FCE8E", dark: "#4FDCA0" },
  { name: "sky", v: "--sky", light: "#54C1FF", dark: "#79CFFF" },
  { name: "pink", v: "--pink", light: "#FF7AC6", dark: "#FF9AD3" },
  { name: "grape", v: "--grape", light: "#B57BFF", dark: "#C79BFF" },
  { name: "on-bright", v: "--on-bright", light: "#1C180F", dark: "#141019" },
  { name: "success", v: "--success", light: "#12A66C", dark: "#2FCF8E" },
  { name: "warn", v: "--warn", light: "#F5A300", dark: "#FFC44D" },
  { name: "danger", v: "--danger", light: "#FF5247", dark: "#FF6A61" },
  { name: "info", v: "--info", light: "#3B82F6", dark: "#6FA8FF" },
  { name: "shadow", v: "--shadow", light: "#1C180F", dark: "#000000" },
];

const SPACES: [string, number][] = [
  ["xs", 4],
  ["sm", 8],
  ["md", 12],
  ["lg", 16],
  ["xl", 20],
  ["xxl", 24],
  ["xxxl", 32],
];
const RADII: [string, number][] = [
  ["sm", 12],
  ["md", 16],
  ["lg", 20],
  ["xl", 26],
];
const SHADOWS: [string, string][] = [
  ["sm", "var(--hard-shadow-sm)"],
  ["md", "var(--hard-shadow-md)"],
  ["lg", "var(--hard-shadow-lg)"],
];
const BORDERS: [string, number][] = [
  ["hair", 1],
  ["base", 1.5],
  ["thick", 2],
];

function Palette({ theme }: { theme: "light" | "dark" }) {
  return (
    <div className={s.palette} data-theme={theme}>
      <div className="t-label" style={{ marginBottom: 8 }}>
        {theme}
      </div>
      {COLORS.map((c) => (
        <div key={c.name} className={s.swatchRow}>
          <span
            className={s.swatchChip}
            style={{ background: `var(${c.v})` }}
          />
          <span className="t-body-strong" style={{ minWidth: 96 }}>
            {c.name}
          </span>
          <span className="t-caption" style={{ color: "var(--subtext)" }}>
            {theme === "light" ? c.light : c.dark}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TokensPage() {
  return (
    <section className={s.section}>
      <h2 className={`t-h1 ${s.sectionTitle}`}>1 · Tokens</h2>

      <h3 className={`t-title ${s.subTitle}`}>Color — both palettes</h3>
      <div className={s.paletteCols}>
        <Palette theme="light" />
        <Palette theme="dark" />
      </div>

      <h3 className={`t-title ${s.subTitle}`}>
        Paper texture — 0.04 / 0.06 / 0.10
      </h3>
      <div className={s.row}>
        {[0.04, 0.06, 0.1].map((o) => (
          <div
            key={o}
            className={s.tile}
            style={{ width: 150, height: 110, borderRadius: 16 }}
          >
            <PaperTexture mode="fill" opacity={o} />
            <span
              className="t-caption"
              style={{
                position: "absolute",
                left: 8,
                bottom: 6,
                color: "var(--subtext)",
              }}
            >
              {o.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <h3 className={`t-title ${s.subTitle}`}>Radii</h3>
      <div className={s.row}>
        {RADII.map(([name, r]) => (
          <div key={name} style={{ textAlign: "center" }}>
            <div
              className={s.tile}
              style={{ width: 72, height: 72, borderRadius: r }}
            />
            <div className="t-caption">
              {name} · {r}
            </div>
          </div>
        ))}
        <div style={{ textAlign: "center" }}>
          <div
            className={s.tile}
            style={{ width: 72, height: 72, borderRadius: 999 }}
          />
          <div className="t-caption">pill</div>
        </div>
      </div>

      <h3 className={`t-title ${s.subTitle}`}>Hard shadows (no blur)</h3>
      <div className={s.row}>
        {SHADOWS.map(([name, sh]) => (
          <div key={name} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 72,
                height: 72,
                background: "var(--surface)",
                border: "var(--border-thick) solid var(--border)",
                borderRadius: 16,
                boxShadow: sh,
              }}
            />
            <div className="t-caption">{name}</div>
          </div>
        ))}
      </div>

      <h3 className={`t-title ${s.subTitle}`}>Spacing</h3>
      <div style={{ display: "grid", gap: 6 }}>
        {SPACES.map(([name, px]) => (
          <div
            key={name}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <span className="t-caption" style={{ width: 56 }}>
              {name} {px}
            </span>
            <span
              style={{
                height: 12,
                width: px,
                background: "var(--brand)",
                borderRadius: 3,
              }}
            />
          </div>
        ))}
      </div>

      <h3 className={`t-title ${s.subTitle}`}>Borders</h3>
      <div className={s.row}>
        {BORDERS.map(([name, w]) => (
          <div key={name} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 72,
                height: 48,
                background: "var(--surface)",
                border: `${w}px solid var(--border)`,
                borderRadius: 12,
              }}
            />
            <div className="t-caption">
              {name} · {w}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
