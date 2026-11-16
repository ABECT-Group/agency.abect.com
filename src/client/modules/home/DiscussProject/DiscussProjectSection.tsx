import { JSX } from 'react';
import type { ServiceType } from '@/payload-types';
import { getAllServices } from '@/client/lib/services';
import DiscussProject, { type ServiceGroup } from './DiscussProject';

type DiscussProjectSectionProps = {
	locale: string;
};

/**
 * Серверна обгортка форми «Обговорити проєкт»: підтягує всі опубліковані послуги (той самий перелік
 * і порядок, що на сторінці «Послуги») і групує їх за типом послуги для списку «Обрати послугу».
 */
export default async function DiscussProjectSection({ locale }: DiscussProjectSectionProps): Promise<JSX.Element> {
	const services = await getAllServices(locale);

	const groups = new Map<string, ServiceGroup>();
	for (const service of services) {
		const type = typeof service.serviceType === 'object' ? (service.serviceType as ServiceType | null) : null;
		const key = type?.slug ?? 'other';
		if (!groups.has(key)) groups.set(key, { label: type?.name ?? '', options: [] });
		groups.get(key)!.options.push({ value: service.slug, label: service.title });
	}

	return <DiscussProject serviceGroups={[...groups.values()]} />;
}
