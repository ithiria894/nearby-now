"use client";

import { useEffect, useState } from "react";
import { IconSun, IconMoon } from "./icons";
import s from "./ThemeToggle.module.css";

// Light/dark toggle (TopBar, all pages). Initial = stored choice, else the OS
// scheme; flipping sets data-theme on <html> (tokens.css) + persists. A
// pre-paint script in the root layout applies the stored choice before first
// paint so there's no flash.
const KEY = "enoki-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      let t: "light" | "dark";
      const stored = localStorage.getItem(KEY);
      if (stored === "light" || stored === "dark") t = stored;
      else
        t = matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      if (active) setTheme(t);
    })();
    return () => {
      active = false;
    };
  }, []);

  const flip = () => {
    if (!theme) return;
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {}
  };

  return (
    <button
      className={s.btn}
      onClick={flip}
      aria-label={
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      }
    >
      {theme === null ? null : theme === "dark" ? (
        <IconSun size={17} />
      ) : (
        <IconMoon size={17} />
      )}
    </button>
  );
}
