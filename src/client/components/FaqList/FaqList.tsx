import type { CSSProperties, JSX, ReactNode } from 'react';
import Image from 'next/image';
import './FaqList.scss';

export type FaqListItem = {
	id: string;
	question: string;
	/** Відповідь — текст або розмітка (наприклад, RichText із CMS) */
	answer: ReactNode;
};

type FaqListProps = {
	items: FaqListItem[];
	/** Група <details name>: у межах групи відкрите одне питання */
	name: string;
	/** Яке питання відкрите спочатку (null — жодне) */
	defaultOpen?: number | null;
	className?: string;
};

/**
 * Акордеон питань нового дизайну (Figma «ABECT», Desktop 6: 184:311 … 184:341) — матове скло, номер «01 /»,
 * кругла стрілка. На <details name>: без JS, відкрите одне питання. Поява — data-reveal (ScrollReveal).
 * Використовується на головній (Faq) і на сторінці послуги (FAQSection).
 */
export default function FaqList({ items, name, defaultOpen = 0, className = '' }: FaqListProps): JSX.Element {
	return (
		<div className={`faq-list ${className}`.trim()}>
			{items.map((item, index) => (
				<details
					key={item.id}
					className="faq-list__item glass"
					name={name}
					open={index === defaultOpen}
					data-reveal=""
					style={{ '--reveal-delay': `${0.035 * index}s`, '--reveal-shift': '16px', '--reveal-blur': '0px' } as CSSProperties}
				>
					<summary className="faq-list__question">
						<span className="faq-list__number">{String(index + 1).padStart(2, '0')} /</span>
						<span className="faq-list__question-text">{item.question}</span>
						<span className="faq-list__icon" aria-hidden="true">
							<Image className="faq-list__icon-closed" src="/icons/arrow-right-36.svg" alt="" width={36} height={36} />
							<Image className="faq-list__icon-open" src="/icons/arrow-right-36-dark.svg" alt="" width={36} height={36} />
						</span>
					</summary>
					<div className="faq-list__answer">{item.answer}</div>
				</details>
			))}
		</div>
	);
}
