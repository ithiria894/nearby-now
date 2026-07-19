import type { Metadata } from "next";
import { DesignShell } from "./DesignShell";

// /design/** ships in prod but must never be indexed (WEB_PLAN §3.8). The
// shell (nav + theme/width controls) is shared across all sub-pages; a layout
// stays mounted while child routes swap, so theme/width persist while browsing.
export const metadata: Metadata = {
  title: "enoki · design",
  robots: { index: false, follow: false },
};

export default function DesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DesignShell>{children}</DesignShell>;
}
