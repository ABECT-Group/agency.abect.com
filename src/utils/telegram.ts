/**
 * Telegram Bot Notification Utility
 * Відправляє повідомлення про нові заявки в Telegram чат
 */

interface SimpleLead {
  type: 'simple';
  name: string;
  contact: string;
  message?: string;
  source?: string;
}

interface CalculatorLead {
  type: 'calculator';
  name: string;
  contact: string;
  message?: string;
  source?: string;
  calculatorData: {
    projectType: string;
    projectTypeName?: string;
    platform: 'weblium' | 'custom';
    pagesCount: number;
    additionalServices: string[];
    additionalServicesNames?: string[];
    urgency: string;
    urgencyName?: string;
    estimatedPrice: number;
    estimatedTimeline?: string;
  };
}

type Lead = SimpleLead | CalculatorLead;

function formatTimestamp(): string {
  return new Date().toLocaleString('uk-UA', {
    timeZone: 'Europe/Kyiv',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Екранує текст для Telegram parse_mode=HTML (достатньо &, <, >).
 * HTML замість MarkdownV2: у MarkdownV2 треба екранувати навіть статичний текст
 * («!», «.», «-» в URL), через що повідомлення раніше відхилялись.
 */
function esc(text: string | number | undefined | null): string {
  if (text === undefined || text === null || text === '') return '';
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Форматує повідомлення для простої форми
 */
function formatSimpleMessage(lead: SimpleLead): string {
  return [
    '🔔 <b>Нова заявка з сайту!</b>',
    '',
    `👤 <b>Ім'я:</b> ${esc(lead.name)}`,
    `📞 <b>Контакт:</b> ${esc(lead.contact)}`,
    lead.message ? `💬 <b>Коментар:</b> ${esc(lead.message)}` : null,
    '',
    `📍 <b>Сторінка:</b> ${esc(lead.source || 'Невідомо')}`,
    `🕐 <b>Час:</b> ${formatTimestamp()}`,
  ].filter((line) => line !== null).join('\n');
}

/**
 * Форматує повідомлення для калькулятора
 */
function formatCalculatorMessage(lead: CalculatorLead): string {
  const { calculatorData } = lead;

  const servicesText = calculatorData.additionalServicesNames?.length
    ? calculatorData.additionalServicesNames.join(', ')
    : calculatorData.additionalServices.join(', ') || 'Немає';

  const platformText = calculatorData.platform === 'weblium' ? 'Weblium' : 'Custom';
  const price = Number(calculatorData.estimatedPrice);

  return [
    '🧮 <b>Нова заявка з калькулятора!</b>',
    '',
    `👤 <b>Ім'я:</b> ${esc(lead.name)}`,
    `📞 <b>Контакт:</b> ${esc(lead.contact)}`,
    '',
    '📋 <b>Деталі проекту:</b>',
    `• <b>Тип:</b> ${esc(calculatorData.projectTypeName || calculatorData.projectType)}`,
    `• <b>Платформа:</b> ${platformText}`,
    `• <b>Сторінок:</b> ${esc(calculatorData.pagesCount)}`,
    `• <b>Додатково:</b> ${esc(servicesText)}`,
    `• <b>Терміни:</b> ${esc(calculatorData.urgencyName || calculatorData.urgency)}`,
    '',
    `💰 <b>Розрахункова вартість:</b> від ${Number.isFinite(price) ? price.toLocaleString('uk-UA') : '—'} грн`,
    calculatorData.estimatedTimeline ? `⏱ <b>Термін:</b> ${esc(calculatorData.estimatedTimeline)}` : null,
    lead.message ? `💬 <b>Коментар:</b> ${esc(lead.message)}` : null,
    '',
    `📍 <b>Сторінка:</b> ${esc(lead.source || '/calculator')}`,
    `🕐 <b>Час:</b> ${formatTimestamp()}`,
  ].filter((line) => line !== null).join('\n');
}

async function postToTelegram(botToken: string, payload: Record<string, unknown>): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    return await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Відправляє повідомлення в Telegram
 */
export async function sendTelegramNotification(lead: Lead): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const threadId = process.env.TELEGRAM_THREAD_ID;

  if (!botToken) { console.error('Telegram: TELEGRAM_BOT_TOKEN not set'); return false; }
  if (!chatId) { console.error('Telegram: TELEGRAM_CHAT_ID not set'); return false; }

  const message = lead.type === 'calculator'
    ? formatCalculatorMessage(lead as CalculatorLead)
    : formatSimpleMessage(lead as SimpleLead);

  const base = {
    chat_id: chatId,
    ...(threadId ? { message_thread_id: Number(threadId) } : {}),
    disable_web_page_preview: true,
  };

  try {
    const response = await postToTelegram(botToken, { ...base, text: message, parse_mode: 'HTML' });
    if (response.ok) return true;

    const error = await response.json().catch(() => ({}));
    console.error('Telegram API error:', error);

    // Запасний варіант — той самий текст без розмітки (у ту саму гілку чату)
    if (typeof error?.description === 'string' && error.description.includes('parse')) {
      const plain = message
        .replace(/<\/?b>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
      const plainResponse = await postToTelegram(botToken, { ...base, text: plain });
      return plainResponse.ok;
    }

    return false;
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return false;
  }
}

export type { Lead, SimpleLead, CalculatorLead };
