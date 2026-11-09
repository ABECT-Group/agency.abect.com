import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { getCalculatorConfig, defaultCalculatorConfig } from '@/client/lib/calculator';
import Calculator, { CalculatorProvider, CalculatorConfig } from '@/client/components/Calculator';
import type { Metadata } from 'next';
import { SITE_URL } from '@/client/config/site';

type Params = {
  params: Promise<{
    locale: string;
  }>;
};

// Нічого не пререндеримо на білді: у Docker-білді немає БД, і сторінки «застигали» б порожніми.
// Кожна сторінка рендериться при першому запиті й кешується до revalidateTag('all') (ISS-022).
export function generateStaticParams() {
	return [];
}

// SEO Metadata
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Calculator.seo' });

  const title = t('title');
  const description = t('description');
  const keywords = t('keywords');

  const fullUrl =
    locale === 'ua'
      ? `${SITE_URL}/calculator`
      : `${SITE_URL}/${locale}/calculator`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: fullUrl,
      languages: {
        'uk-UA': `${SITE_URL}/calculator`,
        'en-US': `${SITE_URL}/en/calculator`,
        'x-default': `${SITE_URL}/en/calculator`,
      },
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName: 'ABECT',
      images: [
        {
          url: locale === 'ua' ? `${SITE_URL}/seo/calculator-og.jpg` : `${SITE_URL}/seo/en-calculator-og.jpg`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: locale === 'ua' ? 'uk_UA' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [locale === 'ua' ? `${SITE_URL}/seo/calculator-og.jpg` : `${SITE_URL}/seo/en-calculator-og.jpg`],
    },
  };
}

// Helper to transform API config to CalculatorConfig (converts null to undefined)
function transformConfig(apiConfig: Awaited<ReturnType<typeof getCalculatorConfig>>): CalculatorConfig {
  if (!apiConfig) return defaultCalculatorConfig;

  return {
    projectTypes: (apiConfig.projectTypes || defaultCalculatorConfig.projectTypes).map((p) => ({
      slug: p.slug,
      name: p.name,
      description: p.description ?? undefined,
      icon: p.icon ?? undefined,
      hasWebliumOption: p.hasWebliumOption ?? false,
      webliumBasePrice: p.webliumBasePrice ?? undefined,
      customBasePrice: p.customBasePrice,
    })),
    pagesConfig: apiConfig.pagesConfig || defaultCalculatorConfig.pagesConfig,
    additionalServices: (apiConfig.additionalServices || defaultCalculatorConfig.additionalServices).map((s) => ({
      slug: s.slug,
      name: s.name,
      description: s.description ?? undefined,
      price: s.price,
      icon: s.icon ?? undefined,
    })),
    urgencyOptions: (apiConfig.urgencyOptions || defaultCalculatorConfig.urgencyOptions).map((u) => ({
      slug: u.slug,
      name: u.name,
      description: u.description ?? undefined,
      coefficient: u.coefficient,
      timelineText: u.timelineText ?? undefined,
    })),
    generalSettings: {
      currency: apiConfig.generalSettings?.currency || defaultCalculatorConfig.generalSettings.currency,
      showPriceFrom: apiConfig.generalSettings?.showPriceFrom ?? defaultCalculatorConfig.generalSettings.showPriceFrom,
      minimumOrderPrice: apiConfig.generalSettings?.minimumOrderPrice ?? defaultCalculatorConfig.generalSettings.minimumOrderPrice,
    },
  };
}

// Server Component
export default async function CalculatorPage({ params }: Params) {
  const { locale } = await params;

  setRequestLocale(locale);

  // Fetch calculator config
  const apiConfig = await getCalculatorConfig(locale);

  // Use API config or default (with proper type transformation)
  const config: CalculatorConfig = transformConfig(apiConfig);

  return (
    <>
      {/* JSON-LD Schema.org - WebApplication */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: locale === 'ua' ? 'Калькулятор вартості сайту' : 'Website Cost Calculator',
            description:
              locale === 'ua'
                ? 'Онлайн калькулятор для розрахунку вартості створення сайту'
                : 'Online calculator for estimating website development cost',
            url:
              locale === 'ua'
                ? `${SITE_URL}/calculator`
                : `${SITE_URL}/${locale}/calculator`,
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'AggregateOffer',
              lowPrice: config.generalSettings.minimumOrderPrice,
              priceCurrency: config.generalSettings.currency,
              offerCount: config.projectTypes.length,
            },
            provider: {
              '@type': 'Organization',
              name: 'ABECT',
              url: SITE_URL,
            },
          }),
        }}
      />

      {/* Breadcrumbs JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: locale === 'ua' ? 'Головна' : 'Home',
                item: SITE_URL,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: locale === 'ua' ? 'Калькулятор' : 'Calculator',
                item:
                  locale === 'ua'
                    ? `${SITE_URL}/calculator`
                    : `${SITE_URL}/${locale}/calculator`,
              },
            ],
          }),
        }}
      />

      <CalculatorProvider initialConfig={config}>
        <Calculator config={config} />
      </CalculatorProvider>
    </>
  );
}
