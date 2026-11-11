'use client';

import { useState } from 'react';
import { Link, usePathname } from '@/client/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Send, Smartphone, Mail, Phone } from 'lucide-react';
import './Footer.scss';

export default function Footer() {
	const t = useTranslations('Footer');
	const pathname = usePathname();
	const [currentYear] = useState(() => new Date().getFullYear());

	const navItems = [
		{ href: '/services', section: 'services' },
		{ href: '/about', section: 'about' },
		{ href: '/portfolio', section: 'portfolio' },
		{ href: '/blog', section: 'blog' },
		{ href: '/contacts', section: 'contacts' }
	];

	const contactLinks = [
		{ href: 'https://t.me/+380980275819', icon: <Send size={20} />, label: 'Telegram' },
		{ href: 'viber://chat/?number=%2B380980275819', icon: <Phone size={20} />, label: 'Viber' }
	];

	const contactInfo = [
		{
			icon: <Mail />,
			href: 'mailto:support@agency.abect.com',
			text: 'support@agency.abect.com',
			type: 'email'
		},
		{
			icon: <Smartphone />,
			href: 'tel:+380980275819',
			text: '+38 (098) 027-58-19',
			type: 'telephone'
		}
	];

	return (
		<footer className="footer" itemScope itemType="https://schema.org/Organization">
			<div className="footer__bg" aria-hidden="true" />
			<div className="container container--design">
				<div className="footer__wrapper">
					<div className="footer__top">
						<div className="footer__section footer__company">
							{/* Логотип — як у хедері (знак + ABECT) */}
							<Link href="/" className="footer__logo">
								<span className="footer__logo-mark" aria-hidden="true" />
								<span itemProp="name">{t('logo')}</span>
							</Link>

							<p className="footer__description" itemProp="description">
								{t('description')}
							</p>
						</div>

						<div className="footer__section footer__menu">
							<div className="footer__section-title">{t('navigation')}</div>
							<nav aria-label={t('navigationAriaLabel')}>
								<ul className="footer__links" itemScope itemType="https://schema.org/ItemList">
									{navItems.map((item) => (
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
												className={pathname === item.href ? 'active' : ''}
											>
												<span itemProp="name">{t(`nav.${item.section}`)}</span>
											</Link>
										</li>
									))}
								</ul>
							</nav>
						</div>

						<div className="footer__section footer__hours-social">
							<div
								className="footer__hours"
								itemProp="openingHoursSpecification"
								itemScope
								itemType="https://schema.org/OpeningHoursSpecification"
							>
								<div className="footer__section-title">{t('workingHours')}</div>
								<ul className="footer__hours-list">
									<li className="footer__hours-item">
										<span>{t('weekdays')}</span>
										<span>{t('workingTime')}</span>
										<meta itemProp="dayOfWeek" content="Monday,Tuesday,Wednesday,Thursday,Friday" />
										<meta itemProp="opens" content="09:00" />
										<meta itemProp="closes" content="18:00" />
									</li>
								</ul>
							</div>

							<div className="footer__social">
								{contactLinks.map((contact, index) => (
									<a
										key={index}
										href={contact.href}
										target="_blank"
										rel="noopener noreferrer"
										className="footer__social-link glass"
										aria-label={contact.label}
									>
										{contact.icon}
									</a>
								))}
							</div>
						</div>

						<div className="footer__section footer__contact">
							<div className="footer__section-title">{t('contacts')}</div>
							<div
								className="footer__contact-info"
								itemProp="contactPoint"
								itemScope
								itemType="https://schema.org/ContactPoint"
							>
								{contactInfo.map((contact, index) => (
									<div key={index} className="footer__contact-item">
										<span className="footer__contact-label glass">
											{contact.icon}
										</span>
										<div className="footer__contact-value">
											<a href={contact.href} itemProp={contact.type}>
												{contact.text}
											</a>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>

					<div className="footer__bottom">
						<div className="footer__copyright">
							© <span id="current-year">{currentYear}</span> {t('logo')}. {t('rights')}
						</div>

						<ul className="footer__legal">
							<li>
								<Link href="/privacy-policy">{t('privacyPolicy')}</Link>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</footer>
	);
}