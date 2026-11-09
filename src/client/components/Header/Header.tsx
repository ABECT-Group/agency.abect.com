'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { Link, usePathname } from '@/client/i18n/navigation';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import './Header.scss';
import { Send, Phone } from 'lucide-react';


export default function Header() {
	const t = useTranslations('Header');
	const tCC = useTranslations('Common');
	const pathname = usePathname();

	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
	const [showIndicator, setShowIndicator] = useState(false);

	const headerRef = useRef<HTMLElement>(null);
	const navRef = useRef<HTMLElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const navItemsRef = useRef<(HTMLElement | null)[]>([]);

	// Touch handling for swipe to close
	const touchStartX = useRef(0);
	const touchStartY = useRef(0);
	const touchEndX = useRef(0);
	const touchEndY = useRef(0);
	const isSwiping = useRef(false);

	// Navigation items - memoized to prevent unnecessary re-renders
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

	const contactLinks = useMemo(
		() => [
			{ href: 'https://t.me/+380980275819', icon: <Send /> },
			{ href: 'viber://chat/?number=%2B380980275819', icon: <Phone /> }
		],
		[]
	);

	// Toggle menu
	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
	};

	// Close menu
	const closeMenu = () => {
		setIsMenuOpen(false);
	};

	// Handle body scroll lock
	useEffect(() => {
		if (isMenuOpen) {
			document.body.classList.add('fixed-body');
		} else {
			document.body.classList.remove('fixed-body');
		}

		return () => {
			document.body.classList.remove('fixed-body');
		};
	}, [isMenuOpen]);

	// Handle scroll effect
	useEffect(() => {
		const handleScroll = () => {
			const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
			setIsScrolled(scrollTop > 50);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	// Update indicator position based on active route
	useEffect(() => {
		const updateIndicator = () => {
			const activeIndex = navItems.findIndex((item) => pathname === item.href);

			if (activeIndex !== -1 && navItemsRef.current[activeIndex]) {
				const liElement = navItemsRef.current[activeIndex];
				const navElement = navRef.current;

				if (liElement && navElement) {
					// Get the actual Link element inside the li
					const linkElement = liElement.querySelector('a');

					if (linkElement) {
						const navRect = navElement.getBoundingClientRect();
						const linkRect = linkElement.getBoundingClientRect();

						setIndicatorStyle({
							left: linkRect.left - navRect.left,
							width: linkRect.width
						});
						setShowIndicator(true);
					}
				}
			} else {
				// Hide indicator if no active item found (e.g., on home page)
				setShowIndicator(false);
			}
		};

		// Small delay to ensure DOM is ready
		const timer = setTimeout(updateIndicator, 0);
		window.addEventListener('resize', updateIndicator);

		return () => {
			clearTimeout(timer);
			window.removeEventListener('resize', updateIndicator);
		};
	}, [pathname, navItems]);

	// Handle touch events for swipe
	const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
		touchStartX.current = e.changedTouches[0].screenX;
		touchStartY.current = e.changedTouches[0].screenY;
		isSwiping.current = false;
	};

	const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
		isSwiping.current = true;
		touchEndX.current = e.changedTouches[0].screenX;
		touchEndY.current = e.changedTouches[0].screenY;
	};

	const handleTouchEnd = () => {
		if (isSwiping.current) {
			const horizontalDistance = touchStartX.current - touchEndX.current;
			const verticalDistance = Math.abs(touchStartY.current - touchEndY.current);

			if (horizontalDistance > 70 && horizontalDistance > verticalDistance) {
				closeMenu();
			}
		}
		isSwiping.current = false;
	};

	return (
		<header ref={headerRef} className={`header ${isScrolled ? 'scrolled' : ''}`}>
			<div className="container">
				<div className="header__wrapper">
					<Link href="/" className="header__logo logo">
						<Image src="/icons/logo.svg" alt="ABECT логотип" width={36} height={36} />
						<span>{t('logo')}</span>
					</Link>

					<div
						ref={menuRef}
						className={`header__menu ${isMenuOpen ? 'active' : ''}`}
						onTouchStart={handleTouchStart}
						onTouchMove={handleTouchMove}
						onTouchEnd={handleTouchEnd}
					>
						<nav
							ref={navRef}
							className="header__menu-nav"
							role="navigation"
							aria-label={t('menuAriaLabel')}
						>
							<ul itemScope itemType="https://schema.org/ItemList">
								{navItems.map((item, index) => (
									<li
										key={item.section}
										itemProp="itemListElement"
										itemScope
										itemType="https://schema.org/ListItem"
										ref={(el) => {
											navItemsRef.current[index] = el;
										}}
									>
										<Link
											href={item.href}
											title={t(`navTitles.${item.section}`)}
											itemProp="url"
											data-section={item.section}
											className={pathname === item.href ? 'active' : ''}
											onClick={closeMenu}
										>
											<span itemProp="name">{t(`nav.${item.section}`)}</span>
										</Link>
									</li>
								))}
							</ul>
							<div
								className={`nav-indicator ${showIndicator ? 'active' : ''}`}
								style={{
									left: `${indicatorStyle.left}px`,
									width: `${indicatorStyle.width}px`
								}}
							/>
						</nav>

						<div className="header__menu-contacts" aria-label={t('contactsAriaLabel')}>
							<ul className="contacts-list">
								{contactLinks.map((contact, index) => (
									<li key={index}>
										<a href={contact.href} target="_blank" rel="noopener noreferrer">
											{contact.icon}
										</a>
									</li>
								))}
							</ul>
						</div>
					</div>
					<div className="header__language">
						<LanguageSwitcher />
					</div>

					<button
						type="button"
						data-open-modal
						className="header__cta cta cta-secondary"
					>
						{tCC('cta')}
					</button>

					<button
						type="button"
						className={`header__burger ${isMenuOpen ? 'active' : ''}`}
						aria-label={t('burgerAriaLabel')}
						onClick={toggleMenu}
					>
						<div className="header__burger-element"></div>
						<div className="header__burger-element"></div>
						<div className="header__burger-element"></div>
					</button>
				</div>
			</div>
		</header>
	);
}