import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/client/i18n/request.ts')

const isDev = process.env.NODE_ENV !== 'production'

// Середовище: production (VPS) або preview (Vercel / тест). Логіка та сама, що в src/utils/env.ts:
// APP_ENV, а якщо не задано — на Vercel `preview`, інакше `production`.
const appEnv = ['production', 'preview'].includes(process.env.APP_ENV?.trim().toLowerCase() ?? '')
  ? process.env.APP_ENV.trim().toLowerCase()
  : process.env.VERCEL
    ? 'preview'
    : 'production'
const isPreview = appEnv !== 'production'

// CSP для публічних сторінок (адмінка Payload виключена — їй потрібні власні правила).
// 'unsafe-eval' — лише в dev (React Refresh). Clarity вантажить скрипти з scripts.clarity.ms,
// тому дозволено *.clarity.ms. 'unsafe-inline' потрібен для JSON-LD і inline-скриптів аналітики.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com https://*.googletagmanager.com https://www.clarity.ms https://*.clarity.ms`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self'",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.clarity.ms",
  "frame-src 'none'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ')

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Мінімальний серверний бандл для Docker (node server.js, без devDependencies)
  output: 'standalone',
  // Не розкривати стек у заголовку X-Powered-By
  poweredByHeader: false,
  // Оптимізовані next/image кешуються тиждень (за замовчуванням 4 години) — ISS-051
  images: {
    minimumCacheTTL: 604800,
  },
  // Next 16: proxy отримує URL з хостом `localhost`, а rewrite порівнюється з URL на основі
  // HOSTNAME (у Docker — 0.0.0.0). Хости не збігаються → rewrite next-intl (/about → /ua/about)
  // трактується як зовнішній і проксіюється по мережі (307-цикл / 500). Ця опція передає в proxy
  // той самий URL, з яким Next порівнює rewrite.
  skipProxyUrlNormalize: true,
  async headers() {
    return [
      {
        source: '/((?!admin).*)',
        headers: securityHeaders,
      },
      // Кешування (ISS-051). Медіа з CMS Payload віддавав без Cache-Control — браузер перевантажував
      // обкладинки щоразу. Нове завантаження в Payload отримує нове ім'я файлу (суфікс), тож доба +
      // фонове оновлення безпечні. Файли заявок (/api/lead-files) сюди не потрапляють — вони приватні.
      {
        source: '/api/media/file/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      // Статика з public/ (Next віддає її з max-age=0). Імена без хешу: змінюючи файл — давати нове ім'я.
      {
        source: '/:dir(images|icons)/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=2592000' }],
      },
      // Превʼю / тестове середовище: заборонити індексацію всього сайту (разом з адмінкою й API)
      ...(isPreview
        ? [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }] }]
        : []),
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
}

// Обгортаємо обидва плагіни (у правильному порядку)
const config = withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false })

// withPayload додає для ВСІХ адрес `Accept-CH` / `Critical-CH: Sec-CH-Prefers-Color-Scheme` (тема адмінки).
// Через Critical-CH Chrome перезапускає перший запит кожного відвідувача сайту (внутрішній 307 на ту саму
// адресу, ~0,6–0,8 с у Lighthouse) — обмежуємо це правило адмінкою, де тема справді потрібна.
const payloadHeaders = config.headers
config.headers = async () =>
  (await payloadHeaders()).map((rule) =>
    rule.source === '/:path*' && rule.headers.some((header) => header.key === 'Critical-CH')
      ? { ...rule, source: '/admin/:path*' }
      : rule
  )

export default config
