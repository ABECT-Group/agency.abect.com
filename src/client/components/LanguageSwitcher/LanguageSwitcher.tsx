'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/client/i18n/navigation';
import './LanguageSwitcher.scss';

// Підписи як у макеті. «E» — звичайним Montserrat (у Montserrat Alternates вона схожа на «Є»).
const languages = [
	{ code: 'ua', lang: 'uk', labelKey: 'ukrainian', label: <>Ua</> },
	{ code: 'en', lang: 'en', labelKey: 'english', label: <><span className="language-switcher__e">E</span>n</> }
] as const;

export default function LanguageSwitcher() {
	const t = useTranslations('Common');
	const locale = useLocale();
	const pathname = usePathname();

	// Мова, на яку вже клікнули: «пігулка» переїжджає одразу, ще до завершення переходу.
	// Діє, лише поки локаль та сама, з якої клікнули, — після будь-якої зміни мови (і «Назад») ігнорується.
	const [pending, setPending] = useState<{ from: string; to: string } | null>(null);
	const active = pending && pending.from === locale ? pending.to : locale;

	return (
		<div className="language-switcher glass" role="group" aria-label={t('language')} data-active={active}>
			{languages.map((item) => {
				const isActive = active === item.code;
				return (
					<Link
						key={item.code}
						href={pathname}
						locale={item.code}
						hrefLang={item.lang}
						className={`language-switcher__option${isActive ? ' active' : ''}`}
						aria-label={t(item.labelKey)}
						aria-current={locale === item.code ? 'true' : undefined}
						onClick={() => setPending({ from: locale, to: item.code })}
					>
						{item.label}
					</Link>
				);
			})}
		</div>
	);
}
