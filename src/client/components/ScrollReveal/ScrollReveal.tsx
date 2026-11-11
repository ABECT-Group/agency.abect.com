'use client';

import { useEffect } from 'react';
import './ScrollReveal.scss';

/**
 * Поява елементів при прокрутці: усім [data-reveal] нижче першого екрана ставить стан «pending»
 * (прихований, ScrollReveal.scss), а коли елемент заходить в екран — «visible» (плавна поява).
 * - Без JS і з prefers-reduced-motion нічого не ховається — контент просто видно.
 * - Те, що вже в межах екрана під час завантаження, не чіпаємо (без миготіння).
 * - Після появи стан знімається, щоб власні transition елементів (hover тощо) працювали як завжди.
 * Затримка — через CSS-змінну --reveal-delay на елементі.
 */
export default function ScrollReveal(): null {
	useEffect(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if (!('IntersectionObserver' in window)) return;

		const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
		const timers: number[] = [];

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					const el = entry.target as HTMLElement;
					observer.unobserve(el);
					el.dataset.revealState = 'visible';
					const delay = parseFloat(getComputedStyle(el).getPropertyValue('--reveal-delay')) || 0;
					timers.push(window.setTimeout(() => delete el.dataset.revealState, delay * 1000 + 1000));
				}
			},
			// Старт, щойно елемент показався з-під нижнього краю екрана
			{ rootMargin: '0px 0px -2% 0px' }
		);

		for (const el of elements) {
			if (el.getBoundingClientRect().top < window.innerHeight * 0.92) continue;
			el.dataset.revealState = 'pending';
			observer.observe(el);
		}

		return () => {
			observer.disconnect();
			timers.forEach(clearTimeout);
		};
	}, []);

	return null;
}
