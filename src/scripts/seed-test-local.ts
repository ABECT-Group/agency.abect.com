/**
 * Тестові дані для ЛОКАЛЬНОЇ БД (доповнює seed-home-local.ts і import:blog):
 * - публікує статті блогу (локально вони імпортовані як чернетки), дві перші — «рекомендовані»;
 * - ще 8 тестових статей (UA і EN) і категорії «Розробка сайтів», «Дизайн»;
 * - англійські назви / описи категорій;
 * - ще 8 проєктів портфоліо (дизайн / сайт / просування, кодом і на конструкторі) — для слайдера, фільтра й сітки;
 * - global «Калькулятор»: типи проєктів, сторінки, додаткові послуги, терміновість, ціни в hero (UA і EN);
 * - послуга «Розробка сайту на Weblium», заведена як «кодом» (як на проді, ISS-046), і локальний адмін seed-test@abect.local;
 * - кілька тестових заявок (проста форма й калькулятор) — Telegram не викликається (його шле лише /api/leads).
 *
 * Запуск з кореня: npm run seed:test  (обкладинки беруться з уже наявних у «Медіа»)
 * Повторний запуск безпечний: записи шукаються за slug / контактом і оновлюються, а не дублюються.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'

// Захист: лише локальна база
const uri = process.env.DATABASE_URI || ''
if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(uri)) {
	console.error('Відмова: DATABASE_URI не локальна')
	process.exit(1)
}

const rich = (...paragraphs: string[]) => ({
	root: {
		type: 'root',
		direction: 'ltr' as const,
		format: '' as const,
		indent: 0,
		version: 1,
		children: paragraphs.map((text) => ({
			type: 'paragraph',
			direction: 'ltr' as const,
			format: '' as const,
			indent: 0,
			version: 1,
			textFormat: 0,
			children: [{ type: 'text', text, version: 1, detail: 0, format: 0, mode: 'normal', style: '' }]
		}))
	}
})

const run = async () => {
	const payload = await getPayload({ config })

	// ---------------------------------------------------------------- Блог
	const posts = await payload.find({ collection: 'posts', limit: 100, depth: 0, sort: 'createdAt' })
	for (const [index, post] of posts.docs.entries()) {
		await payload.update({
			collection: 'posts',
			id: post.id,
			locale: 'uk',
			data: { status: 'published', featured: index < 2 } as never
		})
		console.log(`✓ posts: ${post.slug} → published`)
	}

	const categoriesEn: Record<string, { name: string; description: string }> = {
		'ppc-marketing': { name: 'PPC and marketing', description: 'Paid search, ad campaigns and landing pages that convert.' },
		ecommerce: { name: 'E-commerce and online stores', description: 'Launching and growing online stores: platforms, payments, sales.' }
	}
	const categories = await payload.find({ collection: 'categories', limit: 100, depth: 0 })
	for (const category of categories.docs) {
		const en = categoriesEn[category.slug]
		if (!en) continue
		await payload.update({
			collection: 'categories',
			id: category.id,
			locale: 'en',
			data: { ...en, seo: { metaTitle: `${en.name} | ABECT Blog`, metaDescription: en.description, metaKeywords: en.name } } as never
		})
		console.log(`✓ categories: ${category.slug} (en)`)
	}

	// ---------------------------------------------------------------- Портфоліо
	const media = await payload.find({ collection: 'media', limit: 100, depth: 0, sort: 'createdAt' })
	if (!media.docs.length) {
		console.error('У «Медіа» немає жодного файлу — спершу seed-home-local.ts або import:blog')
		process.exit(1)
	}
	const cover = (i: number) => media.docs[i % media.docs.length].id

	// ---------------------------------------------------------------- Тестові статті блогу (+ 2 категорії)
	const upsertCategory = async (slug: string, uk: [string, string], en: [string, string]) => {
		const found = await payload.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
		const seo = (name: string, description: string) => ({ metaTitle: `${name} | ABECT`, metaDescription: description, metaKeywords: name })
		const ukData = { slug, name: uk[0], description: uk[1], seo: seo(uk[0], uk[1]) }
		const doc = found.docs[0]
			? await payload.update({ collection: 'categories', id: found.docs[0].id, locale: 'uk', data: ukData as never })
			: await payload.create({ collection: 'categories', locale: 'uk', data: ukData as never })
		await payload.update({ collection: 'categories', id: doc.id, locale: 'en', data: { name: en[0], description: en[1], seo: seo(en[0], en[1]) } as never })
		console.log(`✓ categories: ${slug}`)
		return doc.id
	}
	const webCat = await upsertCategory('web-development', ['Розробка сайтів', 'Як створюють сайти: технології, етапи, вартість.'], ['Web development', 'How websites are built: technologies, stages, cost.'])
	const designCat = await upsertCategory('design', ['Дизайн', 'UI/UX, фірмовий стиль і візуал для бізнесу.'], ['Design', 'UI/UX, brand identity and visuals for business.'])

	const author = (await payload.find({ collection: 'users', limit: 1, depth: 0, overrideAccess: true })).docs[0]
	if (!author) {
		console.error('Немає жодного користувача — створіть адміна в /admin')
		process.exit(1)
	}

	type TestPost = { slug: string; category: string | number; date: string; readMin: number; uk: [string, string]; en: [string, string] }
	const testPosts: TestPost[] = [
		{ slug: 'test-landing-vs-website', category: webCat, date: '2026-11-10', readMin: 6, uk: ['Лендінг чи багатосторінковий сайт: що обрати бізнесу', 'Порівнюємо формати сайтів за ціною, термінами й задачами.'], en: ['Landing page or multi-page website: what to choose', 'Comparing website formats by price, timeline and goals.'] },
		{ slug: 'test-code-vs-builder', category: webCat, date: '2026-11-03', readMin: 8, uk: ['Сайт кодом чи на конструкторі: чесне порівняння', 'Коли вистачить Weblium, а коли потрібна індивідуальна розробка.'], en: ['Custom code or website builder: an honest comparison', 'When a builder is enough and when you need custom development.'] },
		{ slug: 'test-website-cost-2026', category: webCat, date: '2026-10-27', readMin: 7, uk: ['Скільки коштує сайт у 2026 році', 'З чого складається ціна сайту і як не переплатити.'], en: ['How much does a website cost in 2026', 'What makes up the price of a website and how not to overpay.'] },
		{ slug: 'test-website-speed', category: webCat, date: '2026-10-15', readMin: 5, uk: ['Чому швидкість сайту впливає на продажі', 'Core Web Vitals простими словами і що з ними робити.'], en: ['Why website speed affects sales', 'Core Web Vitals in plain words and what to do about them.'] },
		{ slug: 'test-ui-trends', category: designCat, date: '2026-10-02', readMin: 4, uk: ['Тренди UI-дизайну, які варто брати у свій сайт', 'Скло, великі заголовки, мікроанімації — що працює, а що ні.'], en: ['UI design trends worth using on your website', 'Glass, big headings, micro-animations — what works and what does not.'] },
		{ slug: 'test-brand-identity', category: designCat, date: '2026-09-18', readMin: 6, uk: ['Фірмовий стиль для малого бізнесу: з чого почати', 'Логотип, кольори, шрифти — мінімальний набір для старту.'], en: ['Brand identity for a small business: where to start', 'Logo, colours, fonts — the minimum set to get started.'] },
		{ slug: 'test-meta-ads-basics', category: 'ppc-marketing', date: '2026-09-05', readMin: 9, uk: ['Реклама в Meta для новачків: покрокова інструкція', 'Як запустити першу кампанію в Facebook та Instagram.'], en: ['Meta ads for beginners: a step-by-step guide', 'How to launch your first Facebook and Instagram campaign.'] },
		{ slug: 'test-store-seo', category: 'ecommerce', date: '2026-08-22', readMin: 7, uk: ['SEO для інтернет-магазину: базовий чекліст', 'Що налаштувати в магазині, щоб товари знаходили в Google.'], en: ['SEO for an online store: a basic checklist', 'What to set up so that products are found in Google.'] }
	]
	const categoryId = async (c: string | number) => {
		if (typeof c !== 'string' || /^[a-f0-9]{24}$/.test(c)) return c
		return (await payload.find({ collection: 'categories', where: { slug: { equals: c } }, limit: 1, depth: 0 })).docs[0]?.id ?? webCat
	}
	for (const [index, p] of testPosts.entries()) {
		const found = await payload.find({ collection: 'posts', where: { slug: { equals: p.slug } }, limit: 1, depth: 0 })
		const body = (lead: string, en = false) =>
			rich(
				lead,
				en
					? 'This is a test article for local development: it checks blog cards, category filter, pagination and the article page.'
					: 'Це тестова стаття для локальної розробки: перевірка карток блогу, фільтра категорій, пагінації та сторінки статті.',
				en ? 'The text is a placeholder and will not be published on the live website.' : 'Текст — заглушка, на бойовий сайт він не потрапляє.'
			)
		const uk = {
			slug: p.slug, title: p.uk[0], description: p.uk[1], content: body(p.uk[1]), author: author.id, category: await categoryId(p.category),
			date: `${p.date}T09:00:00.000Z`, cover: cover(index + 2), readTime: p.readMin * 60, status: 'published', featured: false,
			tags: [{ tag: 'тест' }], seo: { metaTitle: p.uk[0], metaDescription: p.uk[1], metaKeywords: 'тест' }
		}
		const doc = found.docs[0]
			? await payload.update({ collection: 'posts', id: found.docs[0].id, locale: 'uk', data: uk as never })
			: await payload.create({ collection: 'posts', locale: 'uk', data: uk as never })
		await payload.update({
			collection: 'posts',
			id: doc.id,
			locale: 'en',
			data: { title: p.en[0], description: p.en[1], content: body(p.en[1], true), seo: { metaTitle: p.en[0], metaDescription: p.en[1], metaKeywords: 'test' } } as never
		})
		console.log(`✓ posts: ${p.slug}`)
	}

	type Project = {
		slug: string
		service: 'design' | 'website' | 'promotion'
		type: 'custom' | 'builder'
		date: string
		uk: [string, string, string]
		en: [string, string, string]
	}
	const projects: Project[] = [
		{ slug: 'test-coffee-house', service: 'website', type: 'builder', date: '2026-09-12', uk: ['Кавʼярня «Зерно» — сайт-меню', 'Сайт на конструкторі з меню й доставкою', 'Зерно'], en: ['Zerno coffee house — menu website', 'A builder-based website with a menu and delivery', 'Zerno'] },
		{ slug: 'test-dental-clinic', service: 'website', type: 'custom', date: '2026-08-20', uk: ['Стоматологія «Посмішка»', 'Багатосторінковий сайт клініки з онлайн-записом до лікаря', 'Посмішка'], en: ['Smile dental clinic', 'A multi-page clinic website with online booking', 'Smile'] },
		{ slug: 'test-fitness-brand', service: 'design', type: 'custom', date: '2026-07-05', uk: ['FitLab — фірмовий стиль', 'Логотип, кольори й шаблони для соцмереж фітнес-студії', 'FitLab'], en: ['FitLab — brand identity', 'Logo, colours and social media templates for a fitness studio', 'FitLab'] },
		{ slug: 'test-furniture-store', service: 'website', type: 'custom', date: '2026-06-18', uk: ['Меблі «Дуб» — інтернет-магазин', 'Магазин на 600 товарів з онлайн-оплатою й фільтрами', 'Дуб'], en: ['Dub furniture — online store', 'A 600-product store with online payments and filters', 'Dub'] },
		{ slug: 'test-law-firm-ads', service: 'promotion', type: 'custom', date: '2026-05-30', uk: ['Юридична фірма — Google Ads', 'Контекстна реклама: вартість заявки знизилась удвічі', 'Право і Ко'], en: ['Law firm — Google Ads', 'Paid search campaigns that halved the cost per lead', 'Pravo & Co'] },
		{ slug: 'test-flower-shop', service: 'website', type: 'builder', date: '2026-04-11', uk: ['Квіти «Півонія» — лендінг', 'Лендінг на конструкторі для доставки букетів', 'Півонія'], en: ['Pivonia flowers — landing page', 'A builder-based landing page for bouquet delivery', 'Pivonia'] },
		{ slug: 'test-saas-dashboard', service: 'design', type: 'custom', date: '2026-03-02', uk: ['TaskFlow — дизайн дашборду', 'UI-дизайн вебзастосунку для керування задачами', 'TaskFlow'], en: ['TaskFlow — dashboard design', 'UI design for a task management web app', 'TaskFlow'] },
		{ slug: 'test-auto-service-seo', service: 'promotion', type: 'builder', date: '2026-01-25', uk: ['СТО «Мотор» — SEO і реклама', 'Просування сайту СТО в Google і соцмережах', 'Мотор'], en: ['Motor car service — SEO and ads', 'Promoting a car service website in Google and social media', 'Motor'] }
	]

	for (const [index, p] of projects.entries()) {
		const [ukTitle, ukDesc, ukClient] = p.uk
		const [enTitle, enDesc, enClient] = p.en
		const found = await payload.find({ collection: 'portfolio', where: { slug: { equals: p.slug } }, limit: 1, depth: 0 })
		const uk = {
			slug: p.slug, title: ukTitle, shortDescription: ukDesc, client: ukClient, service: p.service, type: p.type,
			projectDate: `${p.date}T00:00:00.000Z`, status: 'published', featured: index < 2, order: 10 + index,
			content: rich(ukDesc, 'Тестовий проєкт для локальної розробки: перевірка слайдера, фільтра й сітки портфоліо.'),
			seo: { metaTitle: ukTitle, metaDescription: ukDesc, metaKeywords: ukClient, ogImage: cover(index) }
		}
		const doc = found.docs[0]
			? await payload.update({ collection: 'portfolio', id: found.docs[0].id, locale: 'uk', data: uk as never })
			: await payload.create({ collection: 'portfolio', locale: 'uk', data: uk as never })
		await payload.update({
			collection: 'portfolio',
			id: doc.id,
			locale: 'en',
			data: {
				title: enTitle, shortDescription: enDesc, client: enClient,
				content: rich(enDesc, 'A test project for local development: checking the slider, filter and portfolio grid.'),
				seo: { metaTitle: enTitle, metaDescription: enDesc, metaKeywords: enClient }
			} as never
		})
		console.log(`✓ portfolio: ${p.slug}`)
	}

	// ---------------------------------------------------------------- Калькулятор (global)
	const projectTypes = [
		{ slug: 'landing', icon: 'layout', hasWebliumOption: true, webliumBasePrice: 3600, customBasePrice: 5400, uk: ['Лендінг', 'Односторінковий сайт для продукту або послуги'], en: ['Landing page', 'A one-page website for a product or service'] },
		{ slug: 'corporate', icon: 'building', hasWebliumOption: true, webliumBasePrice: 9000, customBasePrice: 13500, uk: ['Корпоративний сайт', 'Багатосторінковий сайт для компанії'], en: ['Corporate website', 'A multi-page website for a company'] },
		{ slug: 'shop', icon: 'store', hasWebliumOption: true, webliumBasePrice: 13500, customBasePrice: 20250, uk: ['Інтернет-магазин', 'Каталог, кошик і онлайн-оплата'], en: ['Online store', 'Catalogue, cart and online payments'] },
		{ slug: 'webapp', icon: 'globe', hasWebliumOption: false, customBasePrice: 50000, uk: ['Веб-додаток', 'Складний вебзастосунок з кастомним функціоналом'], en: ['Web application', 'A complex web app with custom functionality'] }
	]
	const additionalServices = [
		{ slug: 'seo', icon: 'search', price: 3000, uk: ['SEO-оптимізація', 'Базова SEO-оптимізація для пошукових систем'], en: ['SEO optimisation', 'Basic search engine optimisation'] },
		{ slug: 'copywriting', icon: 'text', price: 5000, uk: ['Копірайтинг', 'Написання текстів для сайту'], en: ['Copywriting', 'Website copy'] },
		{ slug: 'multilang', icon: 'languages', price: 4000, uk: ['Мультимовність', 'Кілька мов на сайті'], en: ['Multilingual', 'Several languages on the website'] },
		{ slug: 'integrations', icon: 'plug', price: 5000, uk: ['Інтеграції', 'CRM, платіжні системи, зовнішні API'], en: ['Integrations', 'CRM, payment systems, external APIs'] },
		{ slug: 'support', icon: 'support', price: 2000, uk: ['Технічна підтримка', 'Обслуговування після запуску'], en: ['Technical support', 'Maintenance after launch'] }
	]
	const urgencyOptions = [
		{ slug: 'urgent', coefficient: 1.5, uk: ['Терміново', 'Потрібно якнайшвидше', 'до 2 тижнів'], en: ['Urgent', 'As soon as possible', 'up to 2 weeks'] },
		{ slug: 'standard', coefficient: 1, uk: ['Стандартно', 'Звичайні терміни', '2–4 тижні'], en: ['Standard', 'Regular timeline', '2–4 weeks'] },
		{ slug: 'relaxed', coefficient: 0.9, uk: ['Не поспішаємо', 'Можна не поспішати', '1–2 місяці'], en: ['No rush', 'Flexible timeline', '1–2 months'] }
	]
	const heroPrices = [
		{ price: 120, uk: 'Лендінг', en: 'Landing' },
		{ price: 300, uk: 'Сайт', en: 'Website' },
		{ price: 450, uk: 'Магазин', en: 'Store' }
	]

	const calcUk = await payload.updateGlobal({
		slug: 'calculator-config',
		locale: 'uk',
		data: {
			projectTypes: projectTypes.map(({ uk, en: _en, ...rest }, i) => ({ ...rest, name: uk[0], description: uk[1], order: i + 1 })),
			pagesConfig: { webliumPricePerPage: 500, customPricePerPage: 1500, minPages: 1, maxPages: 30, defaultPages: 5 },
			additionalServices: additionalServices.map(({ uk, en: _en, ...rest }, i) => ({ ...rest, name: uk[0], description: uk[1], order: i + 1 })),
			urgencyOptions: urgencyOptions.map(({ uk, en: _en, ...rest }, i) => ({ ...rest, name: uk[0], description: uk[1], timelineText: uk[2], order: i + 1 })),
			generalSettings: { currency: 'UAH', showPriceFrom: true, minimumOrderPrice: 3000 },
			heroPrices: heroPrices.map(({ price, uk }) => ({ price, label: uk })),
			seo: { metaTitle: 'Калькулятор вартості сайту | ABECT', metaDescription: 'Розрахуйте вартість сайту онлайн за кілька кроків.', metaKeywords: 'калькулятор вартості сайту' }
		} as never
	})
	// Англійська локаль — ті самі рядки масивів (за id), лише перекладені поля
	const ids = (rows: unknown) => ((rows as Array<{ id: string }> | null | undefined) || []).map((row) => row.id)
	const [ptIds, asIds, uoIds, hpIds] = [ids(calcUk.projectTypes), ids(calcUk.additionalServices), ids(calcUk.urgencyOptions), ids(calcUk.heroPrices)]
	await payload.updateGlobal({
		slug: 'calculator-config',
		locale: 'en',
		data: {
			projectTypes: (calcUk.projectTypes || []).map((row, i) => ({ ...row, id: ptIds[i], name: projectTypes[i].en[0], description: projectTypes[i].en[1] })),
			additionalServices: (calcUk.additionalServices || []).map((row, i) => ({ ...row, id: asIds[i], name: additionalServices[i].en[0], description: additionalServices[i].en[1] })),
			urgencyOptions: (calcUk.urgencyOptions || []).map((row, i) => ({ ...row, id: uoIds[i], name: urgencyOptions[i].en[0], description: urgencyOptions[i].en[1], timelineText: urgencyOptions[i].en[2] })),
			heroPrices: (calcUk.heroPrices || []).map((row, i) => ({ ...row, id: hpIds[i], label: heroPrices[i].en })),
			seo: { metaTitle: 'Website cost calculator | ABECT', metaDescription: 'Estimate the cost of your website online in a few steps.', metaKeywords: 'website cost calculator' }
		} as never
	})
	console.log('✓ calculator-config (uk, en)')

	// ---------------------------------------------------------------- Послуга «на Weblium», заведена як «кодом» (як на проді, ISS-046)
	// Для перевірки `npm run service:weblium-only`; повторний seed повертає її в «стару» форму
	const webType = (await payload.find({ collection: 'service-types', where: { slug: { equals: 'web-development' } }, limit: 1, depth: 0 })).docs[0]
	if (webType) {
		const slug = 'website-development-weblium'
		const found = await payload.find({ collection: 'services', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
		const uk = {
			slug, title: 'Розробка сайту на Weblium', shortDescription: 'Сайт на конструкторі Weblium під ключ.', serviceType: webType.id,
			featured: true, order: 1, status: 'published', webliumOnly: false, hasWebliumOption: false,
			customPrice: 199, customPriceCurrency: 'USD', customTimeline: '5–7 днів',
			customFeatures: [{ feature: 'Шаблон під ваш бренд' }, { feature: 'Заявки в Telegram' }, { feature: 'Редагування без програміста' }],
			customDescription: 'Швидкий сайт на конструкторі Weblium: готові блоки, адаптив, редагування без програміста.',
			webliumPrice: null, webliumTimeline: null, webliumFeatures: [], webliumDescription: null,
			detailedDescription: rich('Сайт на конструкторі Weblium під ключ. Тестові дані, як на проді (ISS-046).'),
			seo: { metaTitle: 'Розробка сайту на Weblium | ABECT', metaDescription: 'Сайт на конструкторі Weblium під ключ.', metaKeywords: 'weblium' }
		}
		const doc = found.docs[0]
			? await payload.update({ collection: 'services', id: found.docs[0].id, locale: 'uk', data: uk as never })
			: await payload.create({ collection: 'services', locale: 'uk', data: uk as never })
		await payload.update({
			collection: 'services', id: doc.id, locale: 'en',
			data: {
				title: 'Website development on Weblium', shortDescription: 'A turnkey website on the Weblium builder.', customTimeline: '5–7 days',
				customFeatures: [{ feature: 'Template in your brand style' }, { feature: 'Telegram notifications' }, { feature: 'Edit without a developer' }],
				customDescription: 'A fast website on the Weblium builder: ready-made blocks, responsive, editable without a developer.',
				webliumTimeline: null, webliumFeatures: [], webliumDescription: null,
				detailedDescription: rich('A turnkey website on the Weblium builder. Test data mirroring production (ISS-046).'),
				seo: { metaTitle: 'Website development on Weblium | ABECT', metaDescription: 'A turnkey website on the Weblium builder.', metaKeywords: 'weblium' }
			} as never
		})
		console.log(`✓ services: ${slug} (заведена як «кодом», як на проді)`)
	}

	// ---------------------------------------------------------------- Локальний адмін для REST-скриптів (import:blog, service:weblium-only)
	const testEmail = 'seed-test@abect.local'
	const testUser = await payload.find({ collection: 'users', where: { email: { equals: testEmail } }, limit: 1, depth: 0, overrideAccess: true })
	if (!testUser.docs[0]) {
		try {
			await payload.create({ collection: 'users', overrideAccess: true, data: { email: testEmail, password: 'local-test-only', role: 'admin', firstName: 'Seed', lastName: 'Test' } as never })
			console.log(`✓ users: ${testEmail} / local-test-only (лише локальна БД)`)
		} catch (error) {
			console.warn(`! users: ${testEmail} — ${(error as Error).message}`)
		}
	}

	// ---------------------------------------------------------------- Заявки
	const leads = [
		{ name: 'Тест Олена', contact: 'test-olena@example.com', type: 'simple', status: 'new', message: 'Хочу лендінг для курсів англійської. Тестова заявка.' },
		{ name: 'Test John', contact: '+380000000001', type: 'simple', status: 'processing', message: 'Need an online store for handmade goods. Test lead.' },
		{
			name: 'Тест Андрій', contact: '@test_andrii', type: 'calculator', status: 'new', message: 'Тестова заявка з калькулятора.',
			calculatorData: { projectType: 'corporate', platform: 'custom', pagesCount: 8, additionalServices: ['seo', 'multilang'], urgency: 'standard', estimatedPrice: 27500, estimatedTimeline: '2–4 тижні' }
		}
	]
	for (const lead of leads) {
		const found = await payload.find({ collection: 'leads', where: { contact: { equals: lead.contact } }, limit: 1, depth: 0, overrideAccess: true })
		if (found.docs[0]) {
			console.log(`· leads: ${lead.contact} — уже є`)
			continue
		}
		try {
			await payload.create({ collection: 'leads', data: { ...lead, source: 'seed-test-local' } as never })
			console.log(`✓ leads: ${lead.contact}`)
		} catch (error) {
			console.warn(`! leads: ${lead.contact} — ${(error as Error).message}`)
		}
	}

	console.log('\nГотово.')
	process.exit(0)
}

run().catch((error) => {
	console.error(error)
	process.exit(1)
})
