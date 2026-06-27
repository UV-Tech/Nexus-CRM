import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexus CRM",
  description: "Multi-tenant lead management for Facebook, Instagram, WhatsApp and more",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
