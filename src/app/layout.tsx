import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className={`hk min-h-dvh bg-[var(--bg)]`}>{children}</body>
    </html>
  );
}
