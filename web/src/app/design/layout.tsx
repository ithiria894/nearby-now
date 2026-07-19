import type { Metadata } from "next";

// /design ships in prod but must never be indexed (WEB_PLAN §3.8). The page
// itself is a client component (needs state for the toggles), so the noindex
// metadata lives here in a server layout.
export const metadata: Metadata = {
  title: "enoki · design",
  robots: { index: false, follow: false },
};

export default function DesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
