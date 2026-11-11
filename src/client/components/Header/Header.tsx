'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Link, usePathname } from '@/client/i18n/navigation';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import './Header.scss';

// Ширина, з якої меню ховається в бургер (синхронно з Header.scss)
const MOBILE_MAX_WIDTH = 1180;

export default function Header() {
	const t = useTranslations('Header');
	const tC = useTranslations('Common');
	const pathname = usePathname();

	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const [indicator, setIndicator] = useState({ left: 0, width: 0, visible: false });

	const navRef = useRef<HTMLElement>(null);

	const navItems = useMemo(
		() => [
			{ href: '/services', section: 'services' },
			{ href: '/about', section: 'about' },
			{ href: '/portfolio', section: 'portfolio' },
			{ href: '/blog', section: 'blog' },
			{ href: '/contacts', section: 'contacts' }
		],
		[]
	);

	// Активний пункт — і для вкладених сторінок (/blog/<category>/<slug> → «Блог»)
	const activeIndex = navItems.findIndex(
		(item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
	);

	const closeMenu = useCallback(() => setIsMenuOpen(false), []);
	const toggleMenu = () => setIsMenuOpen((open) => !open);

	// Блокування прокрутки під відкритим меню. Лише overflow: hidden не тримає сторінку в iOS Safari
	// і при «протягуванні» прокрутки з меню — тому body фіксується на поточній позиції (top = −scrollY),
	// а після закриття прокрутка повертається туди ж (миттєво, без smooth-scroll з html).
	useEffect(() => {
		if (!isMenuOpen) return;

		const { body } = document;
		const scrollY = window.scrollY;
		body.classList.add('fixed-body');
		body.style.top = `-${scrollY}px`;

		return () => {
			body.classList.remove('fixed-body');
			body.style.top = '';
			window.scrollTo({ top: scrollY, behavior: 'instant' });
		};
	}, [isMenuOpen]);

	// Esc закриває меню; перехід на десктопну ширину — теж (інакше лишиться блок прокрутки)
	useEffect(() => {
		if (!isMenuOpen) return;

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') closeMenu();
		};
		const desktop = window.matchMedia(`(min-width: ${MOBILE_MAX_WIDTH + 1}px)`);
		const onChange = (e: MediaQueryListEvent) => {
			if (e.matches) closeMenu();
		};

		document.addEventListener('keydown', onKeyDown);
		desktop.addEventListener('change', onChange);
		return () => {
			document.removeEventListener('keydown', onKeyDown);
			desktop.removeEventListener('change', onChange);
		};
	}, [isMenuOpen, closeMenu]);

	// Фон хедера після прокрутки
	useEffect(() => {
		const handleScroll = () => setIsScrolled(window.scrollY > 50);
		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	// Підсвітка активного пункту («капсула», що переїжджає між пунктами на десктопі).
	// ResizeObserver перераховує позицію після завантаження шрифту і зміни ширини.
	useEffect(() => {
		const nav = navRef.current;
		if (!nav) return;

		const update = () => {
			const link =
				activeIndex === -1
					? null
					: nav.querySelectorAll<HTMLAnchorElement>('.header__nav-link')[activeIndex];
			if (!link) {
				setIndicator((prev) => ({ ...prev, visible: false }));
				return;
			}
			const navRect = nav.getBoundingClientRect();
			const linkRect = link.getBoundingClientRect();
			setIndicator({ left: linkRect.left - navRect.left, width: linkRect.width, visible: true });
		};

		const observer = new ResizeObserver(update);
		observer.observe(nav);
		return () => observer.disconnect();
	}, [activeIndex]);

	return (
		<header className={`header${isScrolled ? ' scrolled' : ''}${isMenuOpen ? ' menu-open' : ''}`}>
			<div className="container container--design">
				<div className="header__wrapper">
					<Link href="/" className="header__logo" aria-label={t('logoAriaLabel')} onClick={closeMenu}>
						<span className="header__logo-mark" aria-hidden="true" />
						{/* «E» — окремим span (лишився з Montserrat Alternates; зараз увесь хедер — Montserrat) */}
						<span className="header__logo-text" aria-hidden="true">
							AB<span className="header__logo-e">E</span>CT
						</span>
					</Link>

					<div id="header-menu" className={`header__menu${isMenuOpen ? ' active' : ''}`}>
						<nav ref={navRef} className="header__nav glass" aria-label={t('menuAriaLabel')}>
							<ul className="header__nav-list" itemScope itemType="https://schema.org/ItemList">
								{navItems.map((item, index) => (
									<li
										key={item.section}
										itemProp="itemListElement"
										itemScope
										itemType="https://schema.org/ListItem"
									>
										<Link
											href={item.href}
											title={t(`navTitles.${item.section}`)}
											itemProp="url"
											className={`header__nav-link${index === activeIndex ? ' active' : ''}`}
											aria-current={index === activeIndex ? 'page' : undefined}
											onClick={closeMenu}
										>
											<span itemProp="name">{t(`nav.${item.section}`)}</span>
										</Link>
									</li>
								))}
							</ul>
							<span
								className={`header__nav-indicator${indicator.visible ? ' active' : ''}`}
								style={{ width: `${indicator.width}px`, transform: `translateX(${indicator.left}px)` }}
								aria-hidden="true"
							/>
						</nav>

						{/* Лише в мобільному меню */}
						<div className="header__menu-actions">
							<div className="header__menu-controls">
								<LanguageSwitcher />
							</div>
							<button
								type="button"
								data-open-modal
								className="header__order"
								onClick={closeMenu}
							>
								<span className="header__order-label">{t('orderButton')}</span>
								<span className="header__order-arrow glass">
									<Image src="/icons/arrow-39.svg" alt="" width={39} height={39} />
								</span>
							</button>
						</div>
					</div>

					{/* Лише на десктопі */}
					<div className="header__actions">
						<LanguageSwitcher />
						<button type="button" data-open-modal className="header__contact">
							{tC('cta')}
						</button>
					</div>

					<button
						type="button"
						className={`header__burger${isMenuOpen ? ' active' : ''}`}
						aria-label={isMenuOpen ? t('closeMenuAriaLabel') : t('burgerAriaLabel')}
						aria-expanded={isMenuOpen}
						aria-controls="header-menu"
						onClick={toggleMenu}
					>
						{/* Три лінії бургера анімуються в хрестик (геометрія й кольори — з макета) */}
						<span className="header__burger-lines" aria-hidden="true">
							<span />
							<span />
							<span />
						</span>
					</button>
				</div>
			</div>
		</header>
	);
}
