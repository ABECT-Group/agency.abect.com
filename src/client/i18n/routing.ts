import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
	// Список підтримуваних локалей
	locales: ['ua', 'en'],
	defaultLocale: 'ua',
	// Локаль за замовчуванням
	localePrefix: 'as-needed',
	// Без автоматичного редиректу за мовою браузера / cookie: мова — лише з URL, людина перемикає її
	// в хедері. Авторедирект (307 «/» → «/en» для англомовних браузерів) коштував ~800 мс і не
	// рекомендований Google — пошуковику мовні версії показує hreflang (ISS-050).
	localeDetection: false
});