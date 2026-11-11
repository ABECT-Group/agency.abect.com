import type { JSX, ReactNode } from 'react';
import Image from 'next/image';
import { Link } from '@/client/i18n/navigation';
import './ArrowButton.scss';

type ArrowButtonProps = {
	children: ReactNode;
	/** Посилання; без нього — кнопка, що відкриває форму заявки (глобальний обробник data-open-modal) */
	href?: string;
	/** Зовнішнє посилання (інший сайт) — відкривається в новій вкладці */
	external?: boolean;
	/** sm — у картках (38px), md — у заголовках секцій (46px), lg — як у hero (50px) */
	size?: 'sm' | 'md' | 'lg';
	/** Колір пігулки: strong — #0037ef (картки, hero), medium — #1a56cb (секції) */
	tone?: 'strong' | 'medium';
	className?: string;
	ariaLabel?: string;
};

// Синя пігулка + скляне коло зі стрілкою, що накладається на її край (Figma «ABECT»: «Замовити», «Обговорити проєкт»)
export default function ArrowButton({
	children,
	href,
	size = 'md',
	tone = 'medium',
	className = '',
	ariaLabel,
	external = false
}: ArrowButtonProps): JSX.Element {
	const classes = `arrow-btn arrow-btn--${size} arrow-btn--${tone} ${className}`.trim();
	const content = (
		<>
			<span className="arrow-btn__label">{children}</span>
			<span className="arrow-btn__arrow glass" aria-hidden="true">
				<Image src="/icons/arrow-36.svg" alt="" width={36} height={36} />
			</span>
		</>
	);

	if (href && external) {
		return (
			<a href={href} className={classes} aria-label={ariaLabel} target="_blank" rel="noopener noreferrer">
				{content}
			</a>
		);
	}

	if (href) {
		return (
			<Link href={href} className={classes} aria-label={ariaLabel}>
				{content}
			</Link>
		);
	}

	return (
		<button type="button" data-open-modal className={classes} aria-label={ariaLabel}>
			{content}
		</button>
	);
}
