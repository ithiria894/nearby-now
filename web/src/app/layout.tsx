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

export const metadata: Metadata = {
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
    <html lang="en" className={fontVars}>
      <body>
        <PaperTexture />
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </body>
    </html>
  );
}
