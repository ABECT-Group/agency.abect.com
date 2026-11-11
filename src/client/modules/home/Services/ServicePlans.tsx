'use client';

import { JSX, useState } from 'react';
import type { Service } from '@/payload-types';
import type { PlanVariant } from '@/client/components/PlanCard/PlanCard';
import ServicesList from '@/client/components/ServicesList/ServicesList';
import SectionHeading from '@/client/components/SectionHeading/SectionHeading';
import VariantToggle from '@/client/components/VariantToggle/VariantToggle';

type ServicePlansProps = {
	services: Service[];
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
	const hasToggle = services.some((service) => service.hasWebliumOption);

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

			<ServicesList className="services__grid" services={services} variant={variant} animateSwap={switched} />
		</>
	);
}
