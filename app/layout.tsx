import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "وش أرد؟ | لكل موقف، كلام يليق فيه",
  description: "اختر الموقف ونبرة الكلام، وخذ عبارات سعودية طبيعية وسهلة النسخ.",
  applicationName: "وش أرد؟",
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
        <footer className="site-footer">
          <div className="shell footer-inner">
            <Link href="/" className="footer-brand">وش أرد؟</Link>
            <nav aria-label="روابط الموقع"><Link href="/about/">عن المشروع</Link><Link href="/privacy/">الخصوصية</Link></nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
