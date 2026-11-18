'use client';

import { JSX } from 'react';
import Calculator, { CalculatorProvider, type CalculatorConfig } from '@/client/components/Calculator';

// Калькулятор у панелі віджета — окремий модуль, щоб CalculatorWidget вантажив його ліниво (next/dynamic)
export default function WidgetCalculator({ config }: { config: CalculatorConfig }): JSX.Element {
	return (
		<CalculatorProvider initialConfig={config}>
			<Calculator config={config} compact />
		</CalculatorProvider>
	);
}
