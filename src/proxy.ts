import createMiddleware from 'next-intl/middleware';
import { routing } from './client/i18n/routing';

// Next.js 16: middleware.ts → proxy.ts (та сама логіка).
export default createMiddleware({
  ...routing,
  // Мова за замовчуванням (ua) — без префікса в URL
  localePrefix: 'as-needed',
  // hreflang задається в metadata кожної сторінки з коректними кодами (uk-UA, en-US, x-default).
  // Автоматичний заголовок Link від next-intl містив невалідний код `ua` (ISS-010).
  alternateLinks: false,
});

export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|admin|.*\\..*).*)']
};
