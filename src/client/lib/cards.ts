import type { Category, Media, Portfolio, Post, Service, ServiceType, User } from '@/payload-types';

/**
 * Вузькі типи для клієнтських компонентів (картки, шапки сторінок) і мапери з повних документів CMS.
 *
 * Навіщо: усе, що серверний компонент передає в клієнтський ('use client'), серіалізується в HTML
 * (RSC payload). Повний документ послуги з depth 2 тягне детальний опис у Lexical, пов'язані кейси
 * з їхніми текстами й пов'язані послуги — HTML головної важив ~870 КБ, сторінки послуги 1–1,3 МБ,
 * телефон секунди розбирав цей JSON (ISS-049). Картці потрібні лише поля нижче.
 *
 * Правило: у клієнтський компонент — лише Card*-тип (або окремі поля), не повний документ.
 */

export type CardMedia = Pick<Media, 'id' | 'url' | 'alt' | 'width' | 'height'>;

export const toCardMedia = (media: unknown): CardMedia | null => {
	if (!media || typeof media !== 'object') return null;
	const { id, url, alt, width, height } = media as Media;
	return { id, url: url ?? null, alt, width: width ?? null, height: height ?? null };
};

// ---------------------------------------------------------------- Послуга (PlanCard, фільтри, шапка)

export type CardServiceType = Pick<ServiceType, 'id' | 'slug' | 'name'>;

export type CardService = Pick<
	Service,
	| 'id'
	| 'slug'
	| 'title'
	| 'shortDescription'
	| 'featured'
	| 'webliumOnly'
	| 'hasWebliumOption'
	| 'webliumPrice'
	| 'webliumPriceCurrency'
	| 'webliumPriceUah'
	| 'webliumExtraCosts'
	| 'webliumTimeline'
	| 'webliumFeatures'
	| 'webliumDescription'
	| 'customPrice'
	| 'customPriceCurrency'
	| 'customPriceUah'
	| 'customExtraCosts'
	| 'customTimeline'
	| 'customFeatures'
	| 'customDescription'
> & { serviceType: CardServiceType | null };

const toCardServiceType = (type: unknown): CardServiceType | null => {
	if (!type || typeof type !== 'object') return null;
	const { id, slug, name } = type as ServiceType;
	return { id, slug, name };
};

export const toCardService = (service: Service): CardService => ({
	id: service.id,
	slug: service.slug,
	title: service.title,
	shortDescription: service.shortDescription,
	featured: service.featured,
	webliumOnly: service.webliumOnly,
	hasWebliumOption: service.hasWebliumOption,
	webliumPrice: service.webliumPrice,
	webliumPriceCurrency: service.webliumPriceCurrency,
	webliumPriceUah: service.webliumPriceUah,
	webliumExtraCosts: service.webliumExtraCosts,
	webliumTimeline: service.webliumTimeline,
	webliumFeatures: service.webliumFeatures,
	webliumDescription: service.webliumDescription,
	customPrice: service.customPrice,
	customPriceCurrency: service.customPriceCurrency,
	customPriceUah: service.customPriceUah,
	customExtraCosts: service.customExtraCosts,
	customTimeline: service.customTimeline,
	customFeatures: service.customFeatures,
	customDescription: service.customDescription,
	serviceType: toCardServiceType(service.serviceType)
});

/** Варіант послуги: «Розробка кодом» або «На конструкторі» (Weblium) */
export type ServiceVariant = 'custom' | 'weblium';

/**
 * Які варіанти має послуга: лише конструктор (webliumOnly) → ['weblium'];
 * є варіант на Weblium → ['custom', 'weblium']; інакше → ['custom'].
 */
export const serviceVariants = (service: Pick<Service, 'webliumOnly' | 'hasWebliumOption'>): ServiceVariant[] =>
	service.webliumOnly ? ['weblium'] : service.hasWebliumOption ? ['custom', 'weblium'] : ['custom'];

/** Послуги з поля-зв'язку (relatedServices): лише заповнені документи */
export const toCardServices = (list: unknown): CardService[] =>
	Array.isArray(list) ? list.filter((item): item is Service => Boolean(item) && typeof item === 'object').map(toCardService) : [];

// ---------------------------------------------------------------- Кейс (PortfolioCard, шапка кейсу)

export type CardPortfolio = Pick<
	Portfolio,
	'id' | 'slug' | 'title' | 'shortDescription' | 'client' | 'projectDate' | 'service' | 'featured' | 'projectUrl'
> & { seo: { ogImage: CardMedia | null } };

export const toCardPortfolio = (project: Portfolio): CardPortfolio => ({
	id: project.id,
	slug: project.slug,
	title: project.title,
	shortDescription: project.shortDescription,
	client: project.client,
	projectDate: project.projectDate,
	service: project.service,
	featured: project.featured,
	projectUrl: project.projectUrl,
	seo: { ogImage: toCardMedia(project.seo?.ogImage) }
});

/** Кейси з поля-зв'язку (relatedPortfolioProjects): лише заповнені документи */
export const toCardPortfolios = (list: unknown): CardPortfolio[] =>
	Array.isArray(list)
		? list.filter((item): item is Portfolio => Boolean(item) && typeof item === 'object').map(toCardPortfolio)
		: [];

// ---------------------------------------------------------------- Стаття (BlogCard, шапка статті)

export type CardCategory = Pick<Category, 'id' | 'slug' | 'name'>;
export type CardAuthor = Pick<User, 'id' | 'firstName' | 'lastName'>;

export type CardPost = Pick<Post, 'id' | 'slug' | 'title' | 'description' | 'date' | 'readTime' | 'featured' | 'tags' | 'viewCount'> & {
	cover: CardMedia | null;
	category: CardCategory | null;
	author: CardAuthor | null;
};

export const toCardPost = (post: Post): CardPost => {
	const category = post.category && typeof post.category === 'object' ? post.category : null;
	const author = post.author && typeof post.author === 'object' ? post.author : null;
	return {
		id: post.id,
		slug: post.slug,
		title: post.title,
		description: post.description,
		date: post.date,
		readTime: post.readTime,
		featured: post.featured,
		tags: post.tags,
		viewCount: post.viewCount,
		cover: toCardMedia(post.cover),
		category: category ? { id: category.id, slug: category.slug, name: category.name } : null,
		author: author ? { id: author.id, firstName: author.firstName, lastName: author.lastName } : null
	};
};
