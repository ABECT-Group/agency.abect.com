import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/client/i18n/request.ts')

const isDev = process.env.NODE_ENV !== 'production'

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
export default withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false })
