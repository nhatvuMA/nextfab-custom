import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";

// Barlow is the closest open-licence match to NextFab's FF DIN.
const din = Barlow({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-din" });
const display = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-display-face" });

export const metadata: Metadata = {
  title: "Makerspace Philadelphia, PA | Community Workshop | NextFab",
  description: "NextFab is a collaborative makerspace for professional makers in Philadelphia.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${din.variable} ${display.variable} antialiased`}>{children}</body>
    </html>
  );
}
