'use client';

import { CSSProperties, JSX, useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Calculator as CalculatorIcon, X } from 'lucide-react';
import { usePathname } from '@/client/i18n/navigation';
import type { CalculatorConfig } from '@/client/components/Calculator/CalculatorContext';
import './CalculatorWidget.scss';

// Код калькулятора (~2 000 рядків) вантажиться лише при першому відкритті віджета — на сторінки йде тільки кнопка
const WidgetCalculator = dynamic(() => import('./WidgetCalculator'), {
	ssr: false,
	loading: () => <div className="calc-widget__loading" aria-hidden="true" />
});

/** Через скільки після появи кнопки показати підказку «Вітаю, давай прорахуємо…» */
const GREETING_DELAY_MS = 10_000;
/** Підказку закрили — не показувати знову до кінця сесії (sessionStorage; недоступний — просто покажемо ще раз) */
const GREETING_DISMISSED_KEY = 'abect-calc-widget-greeting-closed';

/**
 * Віджет калькулятора — кнопка праворуч унизу, як чат підтримки: відкриває панель із калькулятором
 * (не посилання на /calculator). На головній кнопка з'являється після першого екрана, на інших сторінках —
 * одразу, на /calculator її немає. Через 10 с після появи — підказка з хрестиком.
 */
export default function CalculatorWidget({ config }: { config: CalculatorConfig }): JSX.Element | null {
	const t = useTranslations('Common.CalculatorWidget');
	const pathname = usePathname();
	const isHome = pathname === '/';
	const isCalculatorPage = pathname === '/calculator' || pathname.startsWith('/calculator/');

	const [scrolledPastHero, setScrolledPastHero] = useState(false);
	// Сторінка, на якій відкрили панель: перехід на іншу (зокрема /thx після заявки) — панель закрита сама
	const [openOn, setOpenOn] = useState<string | null>(null);
	const open = openOn === pathname;
	// Калькулятор лишається змонтованим після першого відкриття — вибір не губиться при закритті панелі
	const [mounted, setMounted] = useState(false);
	const [greeting, setGreeting] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);

	const visible = !isCalculatorPage && (!isHome || scrolledPastHero || open);

	// Банер cookie на телефоні — на всю ширину знизу: піднімаємо віджет над ним, поки банер на екрані
	const [bannerOffset, setBannerOffset] = useState(0);
	useEffect(() => {
		let observed: Element | null = null;
		const resize = new ResizeObserver(() => measure());
		const measure = () => {
			const banner = document.querySelector('.cookie-banner');
			if (banner !== observed) {
				if (observed) resize.unobserve(observed);
				if (banner) resize.observe(banner);
				observed = banner;
			}
			const rect = banner?.getBoundingClientRect();
			// Перекриває праву частину екрана (де віджет) — тоді відступ = висота банера від низу екрана
			setBannerOffset(rect && rect.right > window.innerWidth - 120 ? Math.max(0, window.innerHeight - rect.top) : 0);
		};
		measure();
		// Банер з'являється / зникає (згода на cookie) — стежимо за DOM
		const mutations = new MutationObserver(measure);
		mutations.observe(document.body, { childList: true, subtree: true });
		window.addEventListener('resize', measure);
		return () => {
			mutations.disconnect();
			resize.disconnect();
			window.removeEventListener('resize', measure);
		};
	}, []);

	// Головна: кнопка — лише після першого екрана (hero)
	useEffect(() => {
		if (!isHome) return;
		const onScroll = () => setScrolledPastHero(window.scrollY > window.innerHeight * 0.6);
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, [isHome]);

	// Підказка — через 10 с після того, як кнопка стала видимою (якщо її ще не закривали й панель закрита)
	useEffect(() => {
		if (!visible || open) return;
		let dismissed = false;
		try {
			dismissed = sessionStorage.getItem(GREETING_DISMISSED_KEY) === '1';
		} catch {
			// sessionStorage недоступний (приватний режим) — показуємо
		}
		if (dismissed) return;
		const timer = window.setTimeout(() => setGreeting(true), GREETING_DELAY_MS);
		return () => window.clearTimeout(timer);
	}, [visible, open]);

	const dismissGreeting = () => {
		setGreeting(false);
		try {
			sessionStorage.setItem(GREETING_DISMISSED_KEY, '1');
		} catch {
			// без збереження — підказка може з'явитись на наступній сторінці
		}
	};

	const openPanel = () => {
		setMounted(true);
		setOpenOn(pathname);
		setGreeting(false);
	};

	const closePanel = useCallback((returnFocus = true) => {
		setOpenOn(null);
		if (returnFocus) buttonRef.current?.focus();
	}, []);

	// Esc — закрити; фокус — у панель при відкритті
	useEffect(() => {
		if (!open) return;
		panelRef.current?.focus();
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') closePanel();
		};
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [open, closePanel]);

	if (isCalculatorPage) return null;

	return (
		<div
			className={`calc-widget${visible ? ' calc-widget--visible' : ''}${open ? ' calc-widget--open' : ''}`}
			style={bannerOffset ? ({ '--calc-widget-lift': `${bannerOffset}px` } as CSSProperties) : undefined}
		>
			{greeting && !open && (
				<div className="calc-widget__greeting" role="status">
					<button type="button" className="calc-widget__greeting-close" onClick={dismissGreeting} aria-label={t('closeGreeting')}>
						<X size={14} aria-hidden="true" />
					</button>
					<button type="button" className="calc-widget__greeting-text" onClick={openPanel}>
						{t('greeting')}
					</button>
				</div>
			)}

			<div
				ref={panelRef}
				id="calc-widget-panel"
				className="calc-widget__panel glass"
				role="dialog"
				aria-modal="false"
				aria-labelledby="calc-widget-title"
				tabIndex={-1}
				// Закрита панель прихована через visibility (CSS) — з анімацією й без доступу з клавіатури / скрінрідера
				aria-hidden={!open}
			>
				<header className="calc-widget__header">
					<span className="calc-widget__icon" aria-hidden="true">
						<CalculatorIcon size={18} />
					</span>
					<h2 className="calc-widget__title" id="calc-widget-title">
						{t('title')}
					</h2>
					<button type="button" className="calc-widget__close" onClick={() => closePanel()} aria-label={t('close')}>
						<X size={18} aria-hidden="true" />
					</button>
				</header>
				<div className="calc-widget__body">{mounted && <WidgetCalculator config={config} />}</div>
			</div>

			<button
				ref={buttonRef}
				type="button"
				className="calc-widget__button"
				onClick={() => (open ? closePanel(false) : openPanel())}
				aria-expanded={open}
				aria-controls="calc-widget-panel"
				aria-label={open ? t('close') : t('open')}
				tabIndex={visible ? 0 : -1}
			>
				{open ? <X size={26} aria-hidden="true" /> : <CalculatorIcon size={26} aria-hidden="true" />}
			</button>
		</div>
	);
}
