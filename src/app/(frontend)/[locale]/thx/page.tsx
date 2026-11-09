import { redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import ThxPage from '@/client/modules/thx/ThxPage';
import type { Metadata } from 'next';

type Params = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ form?: string; token?: string }>;
};

// Сторінка залежить від query (?form=&token=) — рендеримо на кожен запит, не кешуємо.
export const dynamic = 'force-dynamic';

const VALID_FORMS = ['simple', 'calculator'] as const;
const MAX_AGE_MS = 10 * 60 * 1000;
const TOKEN_RE = /^(\d{13})-[a-z0-9]{9}$/;

function isValidToken(token: string): boolean {
  const match = TOKEN_RE.exec(token);
  if (!match) return false;
  const ts = parseInt(match[1], 10);
  const now = Date.now();
  if (ts > now) return false;
  if (now - ts > MAX_AGE_MS) return false;
  return true;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ThxPage.seo' });

  return {
    title: t('title'),
    description: t('description'),
    robots: { index: false, follow: false },
  };
}

export default async function ThxServerPage({ params, searchParams }: Params) {
  const { locale } = await params;
  const { form, token } = await searchParams;

  setRequestLocale(locale);

  const homeUrl = locale === 'en' ? '/en' : '/';

  if (
    !form ||
    !VALID_FORMS.includes(form as (typeof VALID_FORMS)[number]) ||
    !token ||
    !isValidToken(token)
  ) {
    redirect(homeUrl);
  }

  return <ThxPage form={form as 'simple' | 'calculator'} />;
}
