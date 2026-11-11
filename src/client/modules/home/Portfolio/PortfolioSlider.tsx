'use client';

import { CSSProperties, JSX, useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/client/i18n/navigation';

export type PortfolioSlide = {
	id: string;
	slug: string;
	title: string;
	image: string;
};

// Горизонтальний слайдер на нативній прокрутці (scroll-snap): свайп на телефоні, стрілки на десктопі
export default function PortfolioSlider({ slides }: { slides: PortfolioSlide[] }): JSX.Element {
	const t = useTranslations('HomePage.Portfolio');
	const trackRef = useRef<HTMLUListElement>(null);
	const [edges, setEdges] = useState({ start: true, end: false });

	const updateEdges = useCallback(() => {
		const track = trackRef.current;
		if (!track) return;
		setEdges({
			start: track.scrollLeft <= 2,
			end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 2
		});
	}, []);

	useEffect(() => {
		updateEdges();
		window.addEventListener('resize', updateEdges);
		return () => window.removeEventListener('resize', updateEdges);
	}, [updateEdges]);

	// Гортаємо на ширину однієї картки з проміжком
	const scrollByCard = (direction: 1 | -1) => {
		const track = trackRef.current;
		const slide = track?.firstElementChild as HTMLElement | null;
		if (!track || !slide) return;
		const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
		track.scrollBy({ left: direction * (slide.offsetWidth + gap), behavior: 'smooth' });
	};

	return (
		<div className="portfolio__slider">
			<button
				type="button"
				className="portfolio__arrow portfolio__arrow--prev"
				onClick={() => scrollByCard(-1)}
				disabled={edges.start}
				aria-label={t('prevAriaLabel')}
			>
				<Image src="/icons/arrow-right-36.svg" alt="" width={36} height={36} />
			</button>

			<ul className="portfolio__track" ref={trackRef} onScroll={updateEdges}>
				{slides.map((slide, index) => (
					<li
						key={slide.id}
						className="portfolio__slide"
						data-reveal=""
						style={{ '--reveal-delay': `${0.07 * Math.min(index, 3)}s` } as CSSProperties}
					>
						<Link href={`/portfolio/${slide.slug}`} className="portfolio__card">
							<span className="portfolio__card-image">
								<Image
									src={slide.image}
									alt={slide.title}
									fill
									sizes="(max-width: 768px) 85vw, (max-width: 1024px) 45vw, 400px"
								/>
							</span>
							<span className="portfolio__card-title">{slide.title}</span>
						</Link>
					</li>
				))}
			</ul>

			<button
				type="button"
				className="portfolio__arrow portfolio__arrow--next"
				onClick={() => scrollByCard(1)}
				disabled={edges.end}
				aria-label={t('nextAriaLabel')}
			>
				<Image src="/icons/arrow-right-36.svg" alt="" width={36} height={36} />
			</button>
		</div>
	);
}
