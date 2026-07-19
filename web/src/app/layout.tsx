import type { Metadata } from "next";
import "./globals.css";

// Fonts (Poppins / Inter / Caveat / Madimi One) and the full token system
// arrive in issue #41. This scaffold uses a system stack so the placeholder
// pages render intentionally, not as broken defaults.

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
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
