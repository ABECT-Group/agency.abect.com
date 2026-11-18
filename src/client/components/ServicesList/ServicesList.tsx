'use client';

import { CSSProperties, JSX } from 'react';
import { serviceVariants, type CardService } from '@/client/lib/cards';
import PlanCard, { type PlanVariant } from '../PlanCard/PlanCard';
import './ServicesList.scss';

interface ServicesListProps {
	services: CardService[];
	/** Варіант цін для послуг, що мають конструктор (перемикач — у батьківському компоненті) */
	variant?: PlanVariant;
	/** Плавна зміна вмісту карток при перемиканні (після першого перемикання) */
	animateSwap?: boolean;
	/** Без посилання «Детальніше» (наприклад, на сторінці самої послуги) */
	showDetails?: boolean;
	className?: string;
}

// Сітка карток послуг нового дизайну (PlanCard): 3 колонки → 2 → 1; середня в кожному ряду — виділена
export default function ServicesList({
	services,
	variant = 'custom',
	animateSwap = false,
	showDetails = true,
	className = ''
}: ServicesListProps): JSX.Element | null {
	if (!services?.length) return null;

	return (
		<ul className={`services-list ${className}`.trim()}>
			{services.map((service, index) => (
				<li key={service.id} data-reveal="" style={{ '--reveal-delay': `${0.08 * (index % 3)}s` } as CSSProperties}>
					<PlanCard
						service={service}
						index={index}
						// Якщо в послуги немає обраного варіанта — показується той, що є (лише кодом / лише конструктор)
						variant={serviceVariants(service).includes(variant) ? variant : serviceVariants(service)[0]}
						accent={index % 3 === 1}
						animateSwap={animateSwap}
						showDetails={showDetails}
					/>
				</li>
			))}
		</ul>
	);
}
