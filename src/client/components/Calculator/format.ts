/**
 * Валюта в калькуляторі: гривня — перекладом (`Calculator.currency`: «грн» / «UAH»),
 * інша валюта з CMS — як є (код). Раніше «грн» був захардкоджений і стояв і в EN-версії.
 */
export function currencyLabel(code: string | undefined, translated: string): string {
	return !code || code === 'UAH' ? translated : code;
}

/** Ціна з розділенням тисяч пробілом (39 600) — однаково для обох мов */
export function formatPrice(value: number): string {
	return value.toLocaleString('uk-UA');
}
