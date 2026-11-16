import { CSSProperties, JSX } from 'react';
import { useTranslations } from 'next-intl';
import SectionHeading from '@/client/components/SectionHeading/SectionHeading';
import FloatingDecor from '@/client/components/FloatingDecor/FloatingDecor';
import ArrowButton from '@/client/components/ArrowButton/ArrowButton';
import './Process.scss';

const STEPS = ['brief', 'design', 'development', 'launch'] as const;

export type ProcessStep = { title: string; text: string };

type ProcessProps = {
	/** id секції (якір) і заголовка */
	id?: string;
	title?: string;
	subtitle?: string;
	/** Картки; без них — етапи розробки з головної */
	steps?: ProcessStep[];
	/** Текст кнопки під картками; null — без кнопки */
	cta?: string | null;
};

/**
 * Нахилені картки з номерами — «Як відбувається розробка сайту» (Figma «ABECT», Desktop 6: 166:297,
 * 170:395 … 170:399). Без пропсів — секція головної; з пропсами — та сама верстка з іншим вмістом
 * («Як ми працюємо» на «Про нас», Desktop 8).
 */
export default function Process({ id = 'process', title, subtitle, steps, cta }: ProcessProps): JSX.Element {
	const t = useTranslations('HomePage.Process');

	const items: ProcessStep[] =
		steps ?? STEPS.map((step) => ({ title: t(`steps.${step}.title`), text: t(`steps.${step}.text`) }));
	const ctaLabel = cta === undefined ? t('cta') : cta;
	const headingId = `${id}-title`;

	return (
		<section className="process" id={id} aria-labelledby={headingId}>
			<div className="container container--design">
				<div className="process__head">
					<SectionHeading id={headingId} size="md" title={title ?? t('title')} subtitle={subtitle ?? t('subtitle')} />
					<FloatingDecor
						className="process__decor"
						src="/images/decor/blob.png"
						width={213}
						height={204}
						revealDelay={0.2}
					/>
				</div>

				<ol className="process__steps">
					{items.map((step, index) => (
						<li
							key={step.title}
							className={`process__step process__step--${(index % 4) + 1}`}
							data-reveal=""
							style={{ '--reveal-delay': `${0.08 * index}s`, '--reveal-shift': '40px' } as CSSProperties}
						>
							<span className="process__step-number">{String(index + 1).padStart(2, '0')} /</span>
							<h3 className="process__step-title">{step.title}</h3>
							<p className="process__step-text">{step.text}</p>
						</li>
					))}
				</ol>

				{ctaLabel && (
					<div className="process__cta" data-reveal="">
						<ArrowButton>{ctaLabel}</ArrowButton>
					</div>
				)}
			</div>
		</section>
	);
}
