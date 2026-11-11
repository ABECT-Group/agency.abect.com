/**
 * Тестові дані для ЛОКАЛЬНОЇ БД (mongodb://127.0.0.1:27017/abect): 3 послуги з макета + 4 проєкти портфоліо.
 * Запуск з кореня проєкту: npx tsx src/scripts/seed-home-local.ts <тека з velox-ride-cover.png і psycholog-anna-cover.png>
 * Повторний запуск безпечний: наявні записи з тими самими slug оновлюються, а не дублюються.
 */
import 'dotenv/config'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '../payload.config'

const ASSETS = process.argv[2]

// Захист: лише локальна база
const uri = process.env.DATABASE_URI || ''
if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(uri)) {
	console.error('Відмова: DATABASE_URI не локальна')
	process.exit(1)
}

const rich = (text: string) => ({
	root: {
		type: 'root',
		direction: 'ltr' as const,
		format: '' as const,
		indent: 0,
		version: 1,
		children: [
			{
				type: 'paragraph',
				direction: 'ltr' as const,
				format: '' as const,
				indent: 0,
				version: 1,
				textFormat: 0,
				children: [{ type: 'text', text, version: 1, detail: 0, format: 0, mode: 'normal', style: '' }]
			}
		]
	}
})

type Loc = { uk: Record<string, unknown>; en: Record<string, unknown> }

const run = async () => {
	const payload = await getPayload({ config })

	// Створити або оновити за slug, потім доповнити англійську локаль
	const upsert = async (collection: 'service-types' | 'services' | 'portfolio', slug: string, data: Loc) => {
		const found = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0 })
		const base = { ...data.uk, slug }
		const doc = found.docs[0]
			? await payload.update({ collection, id: found.docs[0].id, locale: 'uk', data: base as never })
			: await payload.create({ collection, locale: 'uk', data: base as never })
		await payload.update({ collection, id: doc.id, locale: 'en', data: data.en as never })
		console.log(`✓ ${collection}: ${slug}`)
		return doc
	}

	const uploadMedia = async (file: string, alt: string) => {
		const filename = path.basename(file)
		const found = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1 })
		if (found.docs[0]) return found.docs[0]
		return payload.create({ collection: 'media', data: { alt } as never, filePath: file })
	}

	const webDev = await upsert('service-types', 'web-development', {
		uk: {
			name: 'Розробка сайтів',
			description: 'Сайти для бізнесу: лендінги, багатосторінкові сайти, інтернет-магазини.',
			order: 1,
			seo: { metaTitle: 'Розробка сайтів | ABECT', metaDescription: 'Розробка сайтів для бізнесу.', metaKeywords: 'розробка сайтів' }
		},
		en: {
			name: 'Web development',
			description: 'Business websites: landing pages, multi-page websites, online stores.',
			seo: { metaTitle: 'Web development | ABECT', metaDescription: 'Website development for business.', metaKeywords: 'web development' }
		}
	})

	const common = { serviceType: webDev.id, featured: true, status: 'published', hasWebliumOption: true, customPriceCurrency: 'USD', webliumPriceCurrency: 'USD' }
	const services: Array<{ slug: string; order: number; custom: number; weblium: number; extras: [string, string]; uk: Record<string, unknown>; en: Record<string, unknown> }> = [
		{
			slug: 'landing-page', order: 1, custom: 120, weblium: 80, extras: ['$22', '$22'],
			uk: {
				title: 'Лендінг', shortDescription: 'Односторінковий сайт для залучення клієнтів та запуску реклами.',
				customDescription: 'Односторінковий сайт для залучення клієнтів та запуску реклами.', customTimeline: '3 дні',
				customFeatures: [{ feature: 'Індивідуальний дизайн і мобільна адаптація' }, { feature: 'Заявки та сповіщення в Telegram' }, { feature: 'SSL, технічне SEO й реєстрація в Google' }],
				webliumDescription: 'Лендінг на конструкторі з готових блоків — швидкий старт реклами.', webliumTimeline: '2 дні',
				webliumFeatures: [{ feature: 'Адаптивний шаблон під ваш бренд' }, { feature: 'Заявки та сповіщення в Telegram' }, { feature: 'Редагування без програміста' }]
			},
			en: {
				title: 'Landing page', shortDescription: 'A one-page website to attract customers and launch ads.',
				customDescription: 'A one-page website to attract customers and launch ads.', customTimeline: '3 days',
				customFeatures: [{ feature: 'Custom design and mobile adaptation' }, { feature: 'Requests and Telegram notifications' }, { feature: 'SSL, technical SEO and Google registration' }],
				webliumDescription: 'A builder-based landing page from ready-made blocks — a quick ad launch.', webliumTimeline: '2 days',
				webliumFeatures: [{ feature: 'Responsive template in your brand style' }, { feature: 'Requests and Telegram notifications' }, { feature: 'Edit without a developer' }]
			}
		},
		{
			slug: 'multi-page-website', order: 2, custom: 300, weblium: 200, extras: ['$30', '$30'],
			uk: {
				title: 'Багатосторінковий сайт', shortDescription: 'Повноцінний сайт для вашого бізнесу.',
				customDescription: 'Повноцінний сайт для вашого бізнесу. Структурована інформація, окремі сторінки послуг та зручна навігація.', customTimeline: '7 днів',
				customFeatures: [{ feature: 'Індивідуальний дизайн і мобільна адаптація' }, { feature: 'Заявки та сповіщення в Telegram' }, { feature: 'SSL, технічне SEO й реєстрація в Google' }],
				webliumDescription: 'Сайт на конструкторі з кількома сторінками й зручним редагуванням.', webliumTimeline: '5 днів',
				webliumFeatures: [{ feature: 'До 7 сторінок на шаблоні' }, { feature: 'Заявки та сповіщення в Telegram' }, { feature: 'Редагування без програміста' }]
			},
			en: {
				title: 'Multi-page website', shortDescription: 'A complete website for your business.',
				customDescription: 'A complete website for your business with structured content, service pages and easy navigation.', customTimeline: '7 days',
				customFeatures: [{ feature: 'Custom design and mobile adaptation' }, { feature: 'Requests and Telegram notifications' }, { feature: 'SSL, technical SEO and Google registration' }],
				webliumDescription: 'A builder-based website with several pages and easy editing.', webliumTimeline: '5 days',
				webliumFeatures: [{ feature: 'Up to 7 template pages' }, { feature: 'Requests and Telegram notifications' }, { feature: 'Edit without a developer' }]
			}
		},
		{
			slug: 'online-store', order: 3, custom: 450, weblium: 300, extras: ['$100', '$60'],
			uk: {
				title: 'Інтернет-магазин', shortDescription: 'Власний простір для продажів.',
				customDescription: 'Власний простір для продажів. Від презентації товарів до оформлення замовлення.', customTimeline: '14 днів',
				customFeatures: [{ feature: 'Індивідуальний дизайн і мобільна адаптація' }, { feature: 'Каталог, категорії до 1 000 товарів' }, { feature: 'Кошик та оформлення замовлень' }, { feature: 'Підключення онлайн-оплати' }],
				webliumDescription: 'Магазин на конструкторі: каталог, кошик і онлайн-оплата з коробки.', webliumTimeline: '10 днів',
				webliumFeatures: [{ feature: 'Каталог до 300 товарів' }, { feature: 'Кошик та оформлення замовлень' }, { feature: 'Підключення онлайн-оплати' }]
			},
			en: {
				title: 'Online store', shortDescription: 'Your own sales space.',
				customDescription: 'Your own sales space, from product showcase to checkout.', customTimeline: '14 days',
				customFeatures: [{ feature: 'Custom design and mobile adaptation' }, { feature: 'Catalog, categories up to 1,000 products' }, { feature: 'Cart and checkout' }, { feature: 'Online payments' }],
				webliumDescription: 'A builder-based store: catalog, cart and online payments out of the box.', webliumTimeline: '10 days',
				webliumFeatures: [{ feature: 'Catalog up to 300 products' }, { feature: 'Cart and checkout' }, { feature: 'Online payments' }]
			}
		}
	]

	for (const s of services) {
		await upsert('services', s.slug, {
			uk: {
				...common, ...s.uk, order: s.order, customPrice: s.custom, webliumPrice: s.weblium,
				// Довідкова ціна в гривнях (курс 45, як у макеті) і додаткові витрати
				customPriceUah: s.custom * 45, webliumPriceUah: s.weblium * 45,
				customExtraCosts: `${s.extras[0]} — домен, хостинг`, webliumExtraCosts: `${s.extras[1]} — домен, тариф конструктора`,
				detailedDescription: rich(String(s.uk.customDescription)),
				seo: { metaTitle: `${s.uk.title} | ABECT`, metaDescription: String(s.uk.shortDescription), metaKeywords: String(s.uk.title) }
			},
			en: {
				...s.en,
				customExtraCosts: `${s.extras[0]} — domain, hosting`, webliumExtraCosts: `${s.extras[1]} — domain, builder plan`,
				detailedDescription: rich(String(s.en.customDescription)),
				seo: { metaTitle: `${s.en.title} | ABECT`, metaDescription: String(s.en.shortDescription), metaKeywords: String(s.en.title) }
			}
		})
	}

	const bike = await uploadMedia(path.join(ASSETS, 'velox-ride-cover.png'), 'VELOX RIDE')
	const psy = await uploadMedia(path.join(ASSETS, 'psycholog-anna-cover.png'), 'Анна — психологиня')

	const projects = [
		{ slug: 'velox-ride', order: 1, cover: bike.id, uk: ['VELOX RIDE — продаж одного товару', 'Лендінг для продажу велосипеда', 'VELOX RIDE'], en: ['VELOX RIDE — single product store', 'A landing page for a bicycle', 'VELOX RIDE'] },
		{ slug: 'psycholog-anna', order: 2, cover: psy.id, uk: ['Анна — психологиня', 'Сайт психологині з онлайн-записом', 'Анна'], en: ['Anna — psychologist', 'A psychologist website with online booking', 'Anna'] },
		{ slug: 'velox-ride-pro', order: 3, cover: bike.id, uk: ['VELOX RIDE PRO — каталог', 'Тестовий проєкт для слайдера', 'VELOX RIDE'], en: ['VELOX RIDE PRO — catalog', 'Test project for the slider', 'VELOX RIDE'] },
		{ slug: 'psycholog-anna-blog', order: 4, cover: psy.id, uk: ['Анна — блог і консультації', 'Тестовий проєкт для слайдера', 'Анна'], en: ['Anna — blog and consultations', 'Test project for the slider', 'Anna'] }
	]
	for (const p of projects) {
		const [ukTitle, ukDesc, ukClient] = p.uk
		const [enTitle, enDesc, enClient] = p.en
		await upsert('portfolio', p.slug, {
			uk: {
				title: ukTitle, shortDescription: ukDesc, client: ukClient, service: 'website', type: 'custom',
				projectDate: '2026-10-01T00:00:00.000Z', content: rich(ukDesc), status: 'published', featured: true, order: p.order,
				seo: { metaTitle: ukTitle, metaDescription: ukDesc, metaKeywords: ukClient, ogImage: p.cover }
			},
			en: { title: enTitle, shortDescription: enDesc, client: enClient, content: rich(enDesc), seo: { metaTitle: enTitle, metaDescription: enDesc, metaKeywords: enClient } }
		})
	}

	console.log('\nГотово.')
	process.exit(0)
}

run().catch((error) => {
	console.error(error)
	process.exit(1)
})
