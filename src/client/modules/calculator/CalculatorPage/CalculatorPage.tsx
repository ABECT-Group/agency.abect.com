import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import Breadcrumbs from '@/client/components/Breadcrumbs/Breadcrumbs';
import PageHero from '@/client/components/PageHero/PageHero';
import ArrowButton from '@/client/components/ArrowButton/ArrowButton';
import ScrollReveal from '@/client/components/ScrollReveal/ScrollReveal';
import Calculator, { CalculatorProvider, type CalculatorConfig } from '@/client/components/Calculator';
import CalculatorGuide from '../CalculatorGuide/CalculatorGuide';
import './CalculatorPage.scss';

/**
 * Сторінка «Калькулятор»: 1) шапка як на «Про нас» (H1 + опис під пошук, кнопка «Почати розрахунок» — прокрутка
 * до калькулятора), 2) сам калькулятор (секція з H2), 3) SEO-текст про розрахунок ціни + FAQ.
 */
export default function CalculatorPage({ config }: { config: CalculatorConfig }): JSX.Element {
	const t = useTranslations('CalculatorPage');

	return (
		// <main> — головний вміст сторінки (landmark для скрінрідерів; flex-колонка, як body — розкладка та сама)
		<main className="page-main">
			<PageHero
				title={t('hero.title')}
				subtitle={t('hero.subtitle')}
				breadcrumbs={<Breadcrumbs chapter="calculator" />}
				actions={
					<ArrowButton size="lg" tone="strong" href="#calculator-form">
						{t('hero.button')}
					</ArrowButton>
				}
			/>
			<div className="calculator-page">
				<CalculatorProvider initialConfig={config}>
					<Calculator config={config} sectionTitle={t('calculatorTitle')} />
				</CalculatorProvider>
				<CalculatorGuide />
			</div>
			<ScrollReveal />
		</main>
	);
}
