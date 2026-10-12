import type { Metadata } from "next";
import { Barlow, Big_Shoulders_Display } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

// Headings and big numbers: tall, condensed capitals (scoreboard feel).
const display = Big_Shoulders_Display({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-heading",
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Card Vault",
  description: "Track your TCG and sports card collection — binders, decks, and values in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${barlow.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
