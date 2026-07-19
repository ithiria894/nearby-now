import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";
import s from "./TopBar.module.css";

// TopBar — global top bar (BAppBar). enoki wordmark (Madimi One) links home;
// `right` slot holds the page's contextual control (profile pill / Leave);
// the theme toggle rides along on every page. 2px ink bottom border.
export function TopBar({ right }: { right?: ReactNode }) {
  return (
    <header className={s.bar}>
      <Link href="/" className={`t-wordmark ${s.wordmark}`}>
        enoki
      </Link>
      <div className={s.right}>
        {right}
        <ThemeToggle />
      </div>
    </header>
  );
}
