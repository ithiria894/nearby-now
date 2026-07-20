import type { Metadata } from "next";
import { Poppins, Inter, Caveat, Madimi_One } from "next/font/google";
import "../styles/tokens.css";
import "../styles/type.css";
import "./globals.css";
import { PaperTexture } from "@/components/PaperTexture";

// Fonts (WEB_PLAN §7.3). Each exposes a CSS variable that tokens.css maps to
// --font-display / --font-body / etc. Poppins = display/heading (600/700),
// Inter = body (400/600), Caveat = accent (700), Madimi One = wordmark only.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-poppins",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-inter",
  display: "swap",
});
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-caveat",
  display: "swap",
});
const madimi = Madimi_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-madimi",
  display: "swap",
});

// Base for resolving relative OG/twitter image URLs to ABSOLUTE (scrapers
// require absolute). Set NEXT_PUBLIC_SITE_URL to the deployed origin in prod
// (e.g. https://enoki.vercel.app); falls back to localhost for dev.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "enoki",
  description:
    "get people together — without being the host. spontaneous hangouts nearby.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fontVars = `${poppins.variable} ${inter.variable} ${caveat.variable} ${madimi.variable}`;
  return (
    <html lang="en" className={fontVars} suppressHydrationWarning>
      <body>
        {/* apply the stored theme BEFORE paint so the toggle choice never flashes */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("enoki-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
        <PaperTexture />
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </body>
    </html>
  );
}
