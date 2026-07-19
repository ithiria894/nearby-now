import Link from "next/link";

// /design — the living design gallery (WEB_PLAN §3.8). This is the SHELL only.
// Sections land across issues #41–#43 and the mockups in #44–#47:
//   §1 tokens · §2 type · §3 components · §4 motion · §5 page mockups
// It is the design GATE: a funnel page is implemented only after its fake-data
// mockup is approved here. Ships in prod under noindex, zero data access.

export const metadata = {
  title: "enoki · design",
  robots: { index: false, follow: false },
};

export default function DesignGallery() {
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 30, fontWeight: 800 }}>enoki · design</h1>
      <p style={{ color: "var(--subtext)", marginTop: 8 }}>
        Living design gallery. Sections arrive in issues #41–#47.
      </p>
      <ul style={{ marginTop: 16, paddingLeft: 20, lineHeight: 1.9 }}>
        <li>§1 Tokens — colors, texture, radii, shadows, spacing (#41)</li>
        <li>§2 Typography — scale, wordmark, en + zh-Hant (#41)</li>
        <li>§3 Components — kit A/B, every state (#42, #43)</li>
        <li>§4 Motion — press, stagger, reduced-motion (#43)</li>
        <li>§5 Page mockups — fake-data, every v1 page + state (#44–#47)</li>
      </ul>
      <p style={{ marginTop: 24 }}>
        <Link href="/">← home</Link>
      </p>
    </main>
  );
}
