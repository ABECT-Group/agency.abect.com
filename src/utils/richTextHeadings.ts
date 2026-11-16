import { generateSlug } from './generateSlug';

/** Мінімальна форма вузла Lexical, потрібна для змісту */
type LexicalNode = {
	type?: string;
	tag?: string;
	text?: string;
	children?: LexicalNode[];
};

type LexicalContent = { root?: { children?: unknown[] } } | null | undefined;

export type TocHeading = {
	/** Сам вузол — щоб RichText поставив той самий id саме цьому заголовку */
	node: object;
	id: string;
	text: string;
	tag: 'h2' | 'h3';
};

// Текст заголовка з сирих даних (з урахуванням вкладених вузлів: посилання, жирний тощо)
function nodeText(node: LexicalNode): string {
	if (typeof node.text === 'string') return node.text;
	return (node.children ?? []).map(nodeText).join('');
}

/**
 * Усі заголовки h2 / h3 верхнього рівня з унікальними id (повтор → `-2`, `-3`…).
 * id рахуються з сирого тексту, а не з JSX: так зміст і текст статті гарантовано збігаються.
 */
export function collectHeadings(content: LexicalContent): TocHeading[] {
	const children = (content?.root?.children ?? []) as LexicalNode[];
	const used = new Map<string, number>();
	const headings: TocHeading[] = [];

	children.forEach((node) => {
		if (node?.type !== 'heading' || (node.tag !== 'h2' && node.tag !== 'h3')) return;
		const text = nodeText(node).trim();
		if (!text) return;

		const base = generateSlug(text) || 'section';
		const count = (used.get(base) ?? 0) + 1;
		used.set(base, count);
		headings.push({ node, id: count === 1 ? base : `${base}-${count}`, text, tag: node.tag });
	});

	return headings;
}

/**
 * Пункти змісту: заголовки h2, а якщо в тексті їх немає (лише h3) — h3.
 * Раніше бралися тільки h2, і в статтях із самими h3 зміст зникав.
 */
export function tocHeadings(content: LexicalContent): TocHeading[] {
	const all = collectHeadings(content);
	const h2 = all.filter((heading) => heading.tag === 'h2');
	return h2.length > 0 ? h2 : all.filter((heading) => heading.tag === 'h3');
}
