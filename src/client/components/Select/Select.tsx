'use client';

import { JSX, KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import './Select.scss';

export type SelectOption = { value: string; label: string };
/** Група пунктів; без label — пункти без заголовка групи */
export type SelectGroup = { label?: string; options: SelectOption[] };

type SelectProps = {
	id?: string;
	value: string;
	onChange: (value: string) => void;
	groups: SelectGroup[];
	/** Текст, поки нічого не обрано */
	placeholder: string;
	/** Доступна назва поля (видимого підпису в макеті немає) */
	ariaLabel: string;
	disabled?: boolean;
	className?: string;
};

/**
 * Кастомний випадний список (замість нативного <select>, який не стилізується): кнопка + скляний список.
 * Доступність — патерн ARIA «select-only combobox»: role=combobox / listbox / option, aria-activedescendant;
 * клавіші ↑ ↓ Home End Enter Space Esc Tab і пошук за першими літерами.
 */
export default function Select({
	id,
	value,
	onChange,
	groups,
	placeholder,
	ariaLabel,
	disabled = false,
	className = ''
}: SelectProps): JSX.Element {
	const autoId = useId();
	const baseId = id || `select-${autoId.replace(/:/g, '')}`;
	const listId = `${baseId}-list`;
	const optionId = (index: number) => `${baseId}-opt-${index}`;

	const rootRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLUListElement>(null);
	const typeahead = useRef({ text: '', timer: 0 });

	const options = useMemo(() => groups.flatMap((group) => group.options), [groups]);
	// Індекс першого пункту кожної групи в загальному списку options
	const groupStarts = useMemo(
		() => groups.reduce<number[]>((starts, _group, i) => [...starts, i === 0 ? 0 : starts[i - 1] + groups[i - 1].options.length], []),
		[groups]
	);
	const selectedIndex = options.findIndex((option) => option.value === value);
	const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

	const [open, setOpen] = useState(false);
	const [active, setActive] = useState(Math.max(selectedIndex, 0));

	const openList = () => {
		if (disabled) return;
		setActive(Math.max(selectedIndex, 0));
		setOpen(true);
	};

	const choose = (index: number) => {
		const option = options[index];
		if (option) onChange(option.value);
		setOpen(false);
	};

	// Клік поза списком — закрити
	useEffect(() => {
		if (!open) return;
		const onPointerDown = (event: PointerEvent) => {
			if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
		};
		document.addEventListener('pointerdown', onPointerDown);
		return () => document.removeEventListener('pointerdown', onPointerDown);
	}, [open]);

	// Активний пункт — у видимій області списку
	useEffect(() => {
		if (!open) return;
		listRef.current?.querySelector<HTMLElement>(`#${CSS.escape(optionId(active))}`)?.scrollIntoView({ block: 'nearest' });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, active]);

	const findByText = (char: string) => {
		const state = typeahead.current;
		window.clearTimeout(state.timer);
		state.text += char.toLowerCase();
		state.timer = window.setTimeout(() => (state.text = ''), 600);
		const start = state.text.length === 1 ? active + 1 : active;
		for (let i = 0; i < options.length; i++) {
			const index = (start + i) % options.length;
			if (options[index].label.toLowerCase().startsWith(state.text)) return index;
		}
		return -1;
	};

	const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
		const last = options.length - 1;
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				if (!open) openList();
				else setActive((i) => Math.min(i + 1, last));
				break;
			case 'ArrowUp':
				event.preventDefault();
				if (!open) openList();
				else setActive((i) => Math.max(i - 1, 0));
				break;
			case 'Home':
				if (open) {
					event.preventDefault();
					setActive(0);
				}
				break;
			case 'End':
				if (open) {
					event.preventDefault();
					setActive(last);
				}
				break;
			case 'Enter':
			case ' ':
				event.preventDefault();
				if (open) choose(active);
				else openList();
				break;
			case 'Escape':
				if (open) {
					event.preventDefault();
					setOpen(false);
				}
				break;
			case 'Tab':
				if (open) choose(active);
				break;
			default:
				if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
					const index = findByText(event.key);
					if (index < 0) break;
					if (open) setActive(index);
					else onChange(options[index].value);
				}
		}
	};

	return (
		<div ref={rootRef} className={`select${open ? ' select--open' : ''}${disabled ? ' select--disabled' : ''} ${className}`.trim()}>
			<button
				type="button"
				id={baseId}
				className={`select__trigger${selected ? '' : ' select__trigger--placeholder'}`}
				role="combobox"
				aria-label={ariaLabel}
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-controls={listId}
				aria-activedescendant={open ? optionId(active) : undefined}
				disabled={disabled}
				onClick={() => (open ? setOpen(false) : openList())}
				onKeyDown={onKeyDown}
			>
				<span className="select__value">{selected ? selected.label : placeholder}</span>
				<svg className="select__arrow" width="15" height="8" viewBox="0 0 15 8" aria-hidden="true">
					<path d="M7.36 0 14.72 8H0z" fill="currentColor" />
				</svg>
			</button>

			<ul ref={listRef} id={listId} className="select__list glass" role="listbox" aria-label={ariaLabel} tabIndex={-1}>
				{groups.map((group, groupIndex) => {
					const items = group.options.map((option, optionIndex) => {
						const index = groupStarts[groupIndex] + optionIndex;
						const isSelected = option.value === value;
						return (
							<li
								key={option.value}
								id={optionId(index)}
								role="option"
								aria-selected={isSelected}
								className={`select__option${index === active ? ' select__option--active' : ''}${isSelected ? ' select__option--selected' : ''}`}
								onPointerMove={() => setActive(index)}
								onClick={() => choose(index)}
							>
								<span>{option.label}</span>
								{isSelected && (
									<svg className="select__check" width="14" height="11" viewBox="0 0 14 11" aria-hidden="true">
										<path d="M1 5.5 5 9.5 13 1.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
								)}
							</li>
						);
					});
					if (!group.label) return items;
					const labelId = `${baseId}-group-${groupIndex}`;
					return (
						<li key={labelId} role="presentation" className="select__group">
							<span id={labelId} className="select__group-label">
								{group.label}
							</span>
							<ul role="group" aria-labelledby={labelId}>
								{items}
							</ul>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
