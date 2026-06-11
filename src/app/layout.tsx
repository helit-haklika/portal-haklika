import type { Metadata } from "next";
import { headers } from "next/headers";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "אזור אישי - הקליקה",
  description: "קרדיט כרטיסיה, חשבוניות וbooking",
  openGraph: {
    title: "אזור אישי - הקליקה",
    description: "קרדיט כרטיסיה, חשבוניות וbooking",
    type: "website",
    locale: "he_IL",
    siteName: "הקליקה",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Reading headers() opts every page into dynamic rendering, so the
  // per-request CSP nonce from src/proxy.ts is applied to Next's inline
  // scripts (statically prerendered pages cannot receive a nonce).
  await headers();
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className={`hk min-h-dvh bg-[var(--bg)]`}>{children}</body>
    </html>
  );
}
