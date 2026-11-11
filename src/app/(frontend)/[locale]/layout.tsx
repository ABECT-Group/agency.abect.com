import type { ReactNode, JSX } from "react";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/client/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { Montserrat, Unbounded, Victor_Mono } from "next/font/google";
import Header from "@/client/components/Header/Header";
import Footer from "@/client/components/Footer/Footer";
import CookieBanner from "@/client/components/CookieBanner";
import Analytics from "@/client/components/Analytics/Analytics";
import { ModalProvider } from "@/client/providers/ModalProvider";
import { Metadata } from "next";
import { SITE_URL } from "@/client/config/site";

import "./globals.scss";

const victorMono = Victor_Mono({
  variable: "--font-victor-mono",
  subsets: ["cyrillic", "latin"],
});

// Основний шрифт сайту (globals.scss → `*`). Self-hosted через next/font — працює з CSP font-src 'self'.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["cyrillic", "latin"],
  display: "swap",
});

// Шрифт заголовків (globals.scss → h1–h6). Variable-шрифт — будь-яка вага без окремих файлів.
const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["cyrillic", "latin"],
  display: "swap",
});

// Спільні метадані для всіх сторінок (сторінки задають лише title/description/OG/alternates)
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  authors: [{ name: "ABECT", url: SITE_URL }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  verification: {
    google: "ne6y1sQrac-nHCrsgVZ2t7svM3vh_B-PK7ZjaIhiahk",
  },
};

// Нічого не пререндеримо на білді (у Docker-білді немає БД) — сторінки рендеряться
// при першому запиті й кешуються до revalidateTag('all'). Див. ISS-022.
export function generateStaticParams(): { locale: string }[] {
  return [];
}

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps): Promise<JSX.Element> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  let messages: Record<string, string> = {};
  try {
    messages = (await import(`../../../../messages/${locale}.json`)).default as Record<string, string>;
  } catch {
    console.error(`[layout] Missing messages for locale: ${locale}, falling back to empty`);
  }

  const langCode = locale === 'ua' ? 'uk' : locale;

  return (
    <html lang={langCode}>
      <body className={`${victorMono.variable} ${montserrat.variable} ${unbounded.variable}`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ModalProvider>
            <Header />
            {children}
            <Footer />
            <CookieBanner locale={locale} />
            <Analytics />
          </ModalProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
