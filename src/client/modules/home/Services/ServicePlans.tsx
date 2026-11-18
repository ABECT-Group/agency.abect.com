'use client';

import { JSX, useState } from 'react';
import { serviceVariants, type CardService } from '@/client/lib/cards';
import type { PlanVariant } from '@/client/components/PlanCard/PlanCard';
import ServicesList from '@/client/components/ServicesList/ServicesList';
import SectionHeading from '@/client/components/SectionHeading/SectionHeading';
import VariantToggle from '@/client/components/VariantToggle/VariantToggle';

type ServicePlansProps = {
	services: CardService[];
	headingId: string;
	title: string;
	subtitle: string;
};

// Заголовок із перемикачем «Розробка кодом / На конструкторі» і картки — клієнтська частина секції
export default function ServicePlans({ services, headingId, title, subtitle }: ServicePlansProps): JSX.Element {
	const [variant, setVariant] = useState<PlanVariant>('custom');
	// Чи перемикали вже варіант — анімація зміни вмісту карток лише після першого перемикання
	const [switched, setSwitched] = useState(false);

	// Перемикач — лише якщо хоч одна послуга має варіант на конструкторі
	const hasToggle = services.some((service) => serviceVariants(service).includes('weblium'));
	// «Розробка кодом» — без послуг «лише на конструкторі»; «На конструкторі» — як раніше: послуга без
	// конструктора показує свій варіант «кодом»
	// Карток на головній — 3
	const visibleServices = (
		variant === 'custom' ? services.filter((service) => serviceVariants(service).includes('custom')) : services
	).slice(0, 3);

	const toggle = hasToggle ? (
		<VariantToggle
			value={variant}
			onChange={(next) => {
				setVariant(next);
				setSwitched(true);
			}}
		/>
	) : undefined;

	return (
		<>
			<SectionHeading id={headingId} title={title} subtitle={subtitle} aside={toggle} />

			<ServicesList className="services__grid" services={visibleServices} variant={variant} animateSwap={switched} />
		</>
	);
}
