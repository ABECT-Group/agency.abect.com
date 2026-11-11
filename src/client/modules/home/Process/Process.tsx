import { CSSProperties, JSX } from 'react';
import { useTranslations } from 'next-intl';
import SectionHeading from '@/client/components/SectionHeading/SectionHeading';
import FloatingDecor from '@/client/components/FloatingDecor/FloatingDecor';
import ArrowButton from '@/client/components/ArrowButton/ArrowButton';
import './Process.scss';

const STEPS = ['brief', 'design', 'development', 'launch'] as const;

// «Як відбувається розробка сайту» — Figma «ABECT», Desktop 6 (166:297, 170:395 … 170:399)
export default function Process(): JSX.Element {
	const t = useTranslations('HomePage.Process');

	return (
		<section className="process" id="process" aria-labelledby="process-title">
			<div className="container container--design">
				<div className="process__head">
					<SectionHeading id="process-title" size="md" title={t('title')} subtitle={t('subtitle')} />
					<FloatingDecor
						className="process__decor"
						src="/images/decor/blob.png"
						width={213}
						height={204}
						revealDelay={0.2}
					/>
				</div>

				<ol className="process__steps">
					{STEPS.map((step, index) => (
						<li
							key={step}
							className={`process__step process__step--${index + 1}`}
							data-reveal=""
							style={{ '--reveal-delay': `${0.08 * index}s`, '--reveal-shift': '40px' } as CSSProperties}
						>
							<span className="process__step-number">{String(index + 1).padStart(2, '0')} /</span>
							<h3 className="process__step-title">{t(`steps.${step}.title`)}</h3>
							<p className="process__step-text">{t(`steps.${step}.text`)}</p>
						</li>
					))}
				</ol>

				<div className="process__cta" data-reveal="">
					<ArrowButton>{t('cta')}</ArrowButton>
				</div>
			</div>
		</section>
	);
}
