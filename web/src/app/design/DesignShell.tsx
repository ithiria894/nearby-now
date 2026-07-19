"use client";

import { useEffect, useState, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./design.module.css";

// Shared shell for /design/** (issue #64). Owns theme + viewport-width and the
// nav. Because a Next layout stays mounted while its child routes swap, this
// state persists as you navigate between sections. Sub-pages just render their
// section content; the width frame + texture live here.

type ThemeMode = "system" | "light" | "dark";
type WidthKey = "p360" | "p390" | "p560" | "full";

const WIDTHS: Record<WidthKey, string> = {
  p360: "360px",
  p390: "390px",
  p560: "560px",
  full: "100%",
};

const NAV = [
  { href: "/design", label: "Overview" },
  { href: "/design/tokens", label: "Tokens" },
  { href: "/design/type", label: "Type" },
  { href: "/design/components", label: "Components" },
  { href: "/design/motion", label: "Motion" },
  { href: "/design/mockups", label: "Mockups" },
];

// Lets sub-pages read the current preview width (e.g. mockups that want to fill
// the frame). Optional — most pages ignore it.
const DesignCtx = createContext<{ width: WidthKey }>({ width: "p390" });
export const useDesign = () => useContext(DesignCtx);

export function DesignShell({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [width, setWidth] = useState<WidthKey>("p390");
  const pathname = usePathname();

  useEffect(() => {
    const el = document.documentElement;
    if (theme === "system") el.removeAttribute("data-theme");
    else el.setAttribute("data-theme", theme);
    return () => el.removeAttribute("data-theme");
  }, [theme]);

  return (
    <DesignCtx.Provider value={{ width }}>
      <div className={s.header}>
        <nav className={s.nav}>
          {NAV.map((n) => {
            const active =
              n.href === "/design"
                ? pathname === "/design"
                : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`${s.navLink} ${active ? s.navActive : ""}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className={s.controls}>
          <div className={s.group}>
            <span className={`t-label ${s.groupLabel}`}>Theme</span>
            {(["system", "light", "dark"] as ThemeMode[]).map((m) => (
              <button
                key={m}
                className={`${s.seg} ${theme === m ? s.segActive : ""}`}
                onClick={() => setTheme(m)}
              >
                {m}
              </button>
            ))}
          </div>
          <div className={s.group}>
            <span className={`t-label ${s.groupLabel}`}>Width</span>
            {(Object.keys(WIDTHS) as WidthKey[]).map((w) => (
              <button
                key={w}
                className={`${s.seg} ${width === w ? s.segActive : ""}`}
                onClick={() => setWidth(w)}
              >
                {w === "full" ? "full" : w.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={s.frame} style={{ maxWidth: WIDTHS[width] }}>
        {children}
      </div>
    </DesignCtx.Provider>
  );
}
