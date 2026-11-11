'use client';

import { CSSProperties, JSX, useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { PlanVariant } from '../PlanCard/PlanCard';
import './VariantToggle.scss';

const VARIANTS: PlanVariant[] = ['custom', 'weblium'];

type VariantToggleProps = {
	value: PlanVariant;
	onChange: (variant: PlanVariant) => void;
	className?: string;
};

/**
 * Перемикач «Розробка кодом / На конструкторі» (Figma «ABECT», Desktop 6: 85:98) — скло,
 * активна «пігулка» переїжджає між кнопками (позиція й ширина — з розмірів кнопок).
 */
export default function VariantToggle({ value, onChange, className = '' }: VariantToggleProps): JSX.Element {
	const t = useTranslations('HomePage.Services');
	const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
	const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

	useLayoutEffect(() => {
		const measure = () => {
			const button = optionRefs.current[VARIANTS.indexOf(value)];
			if (button) setPill({ left: button.offsetLeft, width: button.offsetWidth });
		};
		measure();
		window.addEventListener('resize', measure);
		return () => window.removeEventListener('resize', measure);
	}, [value]);

	return (
		<div
			className={`variant-toggle glass${pill ? ' variant-toggle--ready' : ''} ${className}`.trim()}
			role="group"
			aria-label={t('toggleAriaLabel')}
			style={pill ? ({ '--pill-left': `${pill.left}px`, '--pill-width': `${pill.width}px` } as CSSProperties) : undefined}
		>
			{VARIANTS.map((option, index) => (
				<button
					key={option}
					ref={(el) => {
						optionRefs.current[index] = el;
					}}
					type="button"
					className={`variant-toggle__option${value === option ? ' variant-toggle__option--active' : ''}`}
					aria-pressed={value === option}
					onClick={() => option !== value && onChange(option)}
				>
					{t(`variants.${option}`)}
				</button>
			))}
		</div>
	);
}
