'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import Breadcrumbs from '@/client/components/Breadcrumbs/Breadcrumbs';
import PageHero from '@/client/components/PageHero/PageHero';
import { Send, Mail, Phone, Clock } from 'lucide-react';
import './ContactsPage.scss';

interface ContactsPageProps {
	locale: string;
}

export default function ContactsPage({ locale: _locale }: ContactsPageProps): JSX.Element {
	const t = useTranslations('ContactsPage');

	const socialLinks = [
		{
			name: 'Telegram',
			href: 'https://t.me/+380980275819',
			icon: <Send size={24} />,
			username: '@abect_agency'
		},
		{
			name: 'Viber',
			href: 'viber://chat/?number=%2B380980275819',
			icon: <Phone size={24} />,
			username: '+38 (098) 027-58-19'
		}
	];

	const contactInfo = [
		{
			icon: <Mail size={28} />,
			label: t('email'),
			value: 'support@agency.abect.com',
			href: 'mailto:support@agency.abect.com',
			type: 'email'
		},
		{
			icon: <Phone size={28} />,
			label: t('phoneAlt'),
			value: '+38 (098) 027-58-19',
			href: 'tel:+380980275819',
			type: 'telephone'
		}
	];

	const workingHours = [
		{ day: t('weekdays'), hours: t('workingTime') }
	];

	return (
		<>
			<PageHero
				title={t('title')}
				subtitle={t('subtitle')}
				breadcrumbs={<Breadcrumbs chapter="contacts" />}
			/>
			<section
				className="contacts-page"
				itemScope
				itemType="https://schema.org/ContactPage"
			>
				{/* Шапка — назва й опис сторінки для schema.org (видимі — у PageHero) */}
				<meta itemProp="name" content={t('title')} />
				<meta itemProp="description" content={t('subtitle')} />
				<div className="container container--design">

					{/* Основной контент */}
					<div className="contacts-page__content">
						{/* Контактная информация */}
						<div
							className="contacts-page__info"
							itemProp="contactPoint"
							itemScope
							itemType="https://schema.org/ContactPoint"
						>
							<h2 className="contacts-page__section-title">
								<Mail size={28} />
								{t('contactInfo')}
							</h2>

							<div className="contacts-page__info-grid">
								{contactInfo.map((contact, index) => (
									<a
										key={index}
										href={contact.href}
										className="contacts-page__info-card"
										itemProp={contact.type}
									>
										<div className="contacts-page__info-icon">{contact.icon}</div>
										<div className="contacts-page__info-content">
											<span className="contacts-page__info-label">{contact.label}</span>
											<span className="contacts-page__info-value">{contact.value}</span>
										</div>
									</a>
								))}
							</div>
						</div>

						{/* График работы */}
						<div
							className="contacts-page__hours"
							itemProp="openingHoursSpecification"
							itemScope
							itemType="https://schema.org/OpeningHoursSpecification"
						>
							<h2 className="contacts-page__section-title">
								<Clock size={28} />
								{t('workingHours')}
							</h2>

							<div className="contacts-page__hours-content">
								{workingHours.map((schedule, index) => (
									<div key={index} className="contacts-page__hours-item">
										<span className="contacts-page__hours-day">{schedule.day}</span>
										<span className="contacts-page__hours-time">{schedule.hours}</span>
									</div>
								))}
								<meta itemProp="dayOfWeek" content="Monday,Tuesday,Wednesday,Thursday,Friday" />
								<meta itemProp="opens" content="09:00" />
								<meta itemProp="closes" content="18:00" />
							</div>
						</div>

						{/* Социальные сети */}
						<div className="contacts-page__social">
							<h2 className="contacts-page__section-title">
								<Send size={28} />
								{t('socialMedia')}
							</h2>

							<div className="contacts-page__social-grid">
								{socialLinks.map((social, index) => (
									<a
										key={index}
										href={social.href}
										target="_blank"
										rel="noopener noreferrer"
										className="contacts-page__social-card"
									>
										<div className="contacts-page__social-icon">{social.icon}</div>
										<div className="contacts-page__social-content">
											<span className="contacts-page__social-name">{social.name}</span>
											<span className="contacts-page__social-username">{social.username}</span>
										</div>
									</a>
								))}
							</div>
						</div>

						{/* Призыв к действию */}
						<div className="contacts-page__cta">
							<h2 className="contacts-page__cta-title">{t('ctaTitle')}</h2>
							<p className="contacts-page__cta-text">{t('ctaText')}</p>
							<button type="button" className="cta cta-primary">
								{t('ctaButton')}
							</button>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
