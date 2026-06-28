import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nexus CRM",
  description: "ניהול לידים רב-לקוחי ל-Facebook, Instagram, WhatsApp ועוד",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={rubik.variable}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
