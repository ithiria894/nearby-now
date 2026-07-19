import Link from "next/link";
import type { ReactNode } from "react";
import s from "./TopBar.module.css";

// TopBar — global top bar (BAppBar). enoki wordmark (Madimi One) links home;
// `right` slot holds "My rooms" / language toggle. 2px ink bottom border.
export function TopBar({ right }: { right?: ReactNode }) {
  return (
    <header className={s.bar}>
      <Link href="/" className={`t-wordmark ${s.wordmark}`}>
        enoki
      </Link>
      <div className={s.right}>{right}</div>
    </header>
  );
}
