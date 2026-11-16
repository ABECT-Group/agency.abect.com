import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import type { DataFromCollectionSlug } from 'payload';
import config from '@payload-config';
import { sendTelegramNotification } from '@/utils/telegram';
import type { Lead } from '@/utils/telegram';
import { LEAD_FILE_MAX_SIZE, LEAD_FILE_MIME_TYPES } from '@/collections/LeadFiles';

// In-memory rate limiter (5 requests / IP / 60s). Один інстанс — достатньо.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW = 60_000;
const RATE_MAX = 5;
const RATE_MAP_MAX_SIZE = 10_000;

// Обмеження довжини полів (захист від сміття й величезних записів у БД / Telegram)
const MAX_NAME = 200;
const MAX_CONTACT = 320;
const MAX_MESSAGE = 5_000;
const MAX_SOURCE = 2_000;
const MAX_UTM = 200;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  if (rateLimitMap.size > RATE_MAP_MAX_SIZE) {
    for (const [key, value] of rateLimitMap) {
      if (value.resetAt < now) rateLimitMap.delete(key);
    }
  }
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_MAX) return false;
  entry.count++;
  return true;
}

interface SimpleLeadRequest {
  type: 'simple';
  name: string;
  contact: string;
  message?: string;
  source?: string;
  utm?: { source?: string; medium?: string; campaign?: string };
}

interface CalculatorLeadRequest {
  type: 'calculator';
  name: string;
  contact: string;
  message?: string;
  source?: string;
  utm?: { source?: string; medium?: string; campaign?: string };
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

type LeadRequest = SimpleLeadRequest | CalculatorLeadRequest;

type LeadStatus = 'new' | 'processing' | 'completed' | 'rejected';

interface LeadCreateData {
  name: string;
  contact: string;
  message?: string;
  type: 'simple' | 'calculator';
  source?: string;
  utm?: { source?: string; medium?: string; campaign?: string };
  status: LeadStatus;
  calculatorData?: {
    projectType: string;
    platform: 'weblium' | 'custom';
    pagesCount: number;
    additionalServices: string[];
    urgency: string;
    estimatedPrice: number;
    estimatedTimeline?: string;
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 320;
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 13;
}

function isValidContact(contact: string): boolean {
  return isValidEmail(contact) || isValidPhone(contact);
}

/**
 * IP клієнта. nginx ставить `X-Real-IP $remote_addr` — його клієнт підробити не може.
 * Запасний варіант — ОСТАННЄ значення X-Forwarded-For (його дописує nginx);
 * перше значення контролює клієнт, тому брати його не можна.
 */
function getClientIp(request: NextRequest): string {
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return 'unknown';
}

/**
 * CSRF-захист: якщо браузер надіслав Origin, його host має збігатися з хостом сайту.
 * Порівнюємо host цілком (а не startsWith, який пропускав `agency.abect.com.evil.com`).
 */
function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // не браузер — CSRF неможливий
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const allowed = new Set<string>();
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  if (serverUrl) {
    try {
      allowed.add(new URL(serverUrl).host);
    } catch {
      // некоректний NEXT_PUBLIC_SERVER_URL — ігноруємо
    }
  }
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (host) allowed.add(host);
  return allowed.has(originHost);
}

// ============ ВКЛАДЕННЯ (форма «Обговорити проєкт») ============

type Attachment = { data: Buffer; mimetype: string; name: string; size: number };

/** Розширення → MIME. Тип визначаємо самі (за розширенням + сигнатурою), а не довіряємо браузеру. */
const EXTENSION_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain',
};

const MAX_FILE_MB = Math.round(LEAD_FILE_MAX_SIZE / 1024 / 1024);

const startsWith = (data: Buffer, bytes: number[], offset = 0) =>
  data.length >= offset + bytes.length && bytes.every((byte, i) => data[offset + i] === byte);

/** Чи відповідає вміст файлу заявленому типу (сигнатура) — щоб під .pdf не підсунули щось інше */
function matchesSignature(data: Buffer, mimetype: string): boolean {
  switch (mimetype) {
    case 'application/pdf':
      return startsWith(data, [0x25, 0x50, 0x44, 0x46]); // %PDF
    case 'image/png':
      return startsWith(data, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'image/jpeg':
      return startsWith(data, [0xff, 0xd8, 0xff]);
    case 'image/webp':
      return startsWith(data, [0x52, 0x49, 0x46, 0x46]) && startsWith(data, [0x57, 0x45, 0x42, 0x50], 8); // RIFF….WEBP
    case 'application/msword':
    case 'application/vnd.ms-excel':
      return startsWith(data, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]); // OLE2
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return startsWith(data, [0x50, 0x4b, 0x03, 0x04]); // ZIP (OOXML)
    case 'text/plain':
      // Текст: без нульових байтів у перших 8 КБ
      return !data.subarray(0, 8192).includes(0);
    default:
      return false;
  }
}

/** Безпечне ім'я файлу: лише латиниця, цифри, «-», «_»; без шляхів; розширення — з білого списку */
function safeFileName(original: string, extension: string): string {
  const base = original
    .replace(/\.[^.]*$/, '')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return `lead-${Date.now()}-${base || 'file'}.${extension}`;
}

/** Перевіряє файл із форми. Повертає вкладення або текст помилки для користувача. */
async function readAttachment(file: File): Promise<Attachment | { error: string }> {
  if (file.size === 0) return { error: 'Файл порожній' };
  if (file.size > LEAD_FILE_MAX_SIZE) {
    return { error: `Файл завеликий (максимум ${MAX_FILE_MB} МБ)` };
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mimetype = EXTENSION_MIME[extension];
  if (!mimetype || !LEAD_FILE_MIME_TYPES.includes(mimetype)) {
    return { error: 'Непідтримуваний тип файлу. Дозволено: PDF, DOC(X), XLS(X), TXT, PNG, JPG, WEBP' };
  }

  const data = Buffer.from(await file.arrayBuffer());
  if (!matchesSignature(data, mimetype)) {
    return { error: 'Вміст файлу не відповідає його типу' };
  }

  return { data, mimetype, name: safeFileName(file.name, extension), size: data.length };
}

/**
 * Тіло запиту: JSON (звичайні заявки, калькулятор) або multipart/form-data (заявка з файлом).
 * У multipart текстові поля — як у JSON, `utm` — JSON-рядком, файл — у полі `file`.
 */
async function readRequest(
  request: NextRequest
): Promise<{ body: LeadRequest; file?: File } | { error: string; status: number }> {
  const contentType = request.headers.get('content-type') ?? '';

  if (!contentType.startsWith('multipart/form-data')) {
    return { body: (await request.json()) as LeadRequest };
  }

  // Грубий запобіжник до розбору тіла (точний розмір файлу перевіряється далі)
  const length = Number(request.headers.get('content-length'));
  if (Number.isFinite(length) && length > LEAD_FILE_MAX_SIZE + 64 * 1024) {
    return { error: `Файл завеликий (максимум ${MAX_FILE_MB} МБ)`, status: 413 };
  }

  const form = await request.formData();
  const text = (key: string) => {
    const value = form.get(key);
    return typeof value === 'string' ? value : undefined;
  };

  let utm: SimpleLeadRequest['utm'];
  try {
    const raw = text('utm');
    utm = raw ? JSON.parse(raw) : undefined;
  } catch {
    utm = undefined;
  }

  const file = form.get('file');
  return {
    body: {
      type: text('type') as 'simple',
      name: text('name') ?? '',
      contact: text('contact') ?? '',
      message: text('message'),
      source: text('source'),
      utm,
    },
    file: file instanceof File && file.size > 0 ? file : undefined,
  };
}

function clip(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

const MAX_LIST = 50;

function clipList(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, MAX_LIST)
    .map((item) => clip(item, max))
    .filter((item): item is string => Boolean(item));
}

/** Перевіряє й нормалізує дані калькулятора. Повертає undefined, якщо дані некоректні. */
function normalizeCalculatorData(raw: unknown): CalculatorLeadRequest['calculatorData'] | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const data = raw as Record<string, unknown>;
  const projectType = clip(data.projectType, MAX_UTM);
  const platform = data.platform;
  if (!projectType || (platform !== 'weblium' && platform !== 'custom')) return undefined;

  const pagesCount = Number(data.pagesCount);
  const estimatedPrice = Number(data.estimatedPrice);

  return {
    projectType,
    projectTypeName: clip(data.projectTypeName, MAX_UTM),
    platform,
    pagesCount: Number.isFinite(pagesCount) ? Math.max(0, Math.min(Math.round(pagesCount), 10_000)) : 0,
    additionalServices: clipList(data.additionalServices, MAX_UTM),
    additionalServicesNames: clipList(data.additionalServicesNames, MAX_UTM),
    urgency: clip(data.urgency, MAX_UTM) ?? '',
    urgencyName: clip(data.urgencyName, MAX_UTM),
    estimatedPrice: Number.isFinite(estimatedPrice) ? Math.max(0, estimatedPrice) : 0,
    estimatedTimeline: clip(data.estimatedTimeline, MAX_UTM),
  };
}


export async function POST(request: NextRequest) {
  // Origin check — allow only same-site requests
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  // Rate limiting
  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: 'Забагато запитів. Спробуйте через хвилину.' },
      { status: 429 }
    );
  }

  try {
    const parsed = await readRequest(request);
    if ('error' in parsed) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: parsed.status });
    }
    const { body, file } = parsed;

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Невірний формат запиту' }, { status: 400 });
    }

    if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > MAX_NAME) {
      return NextResponse.json(
        { success: false, error: "Ім'я повинно містити мінімум 2 символи" },
        { status: 400 }
      );
    }

    if (typeof body.contact !== 'string' || body.contact.length > MAX_CONTACT || !isValidContact(body.contact.trim())) {
      return NextResponse.json(
        { success: false, error: 'Введіть коректний телефон або email' },
        { status: 400 }
      );
    }

    if (!body.type || !['simple', 'calculator'].includes(body.type)) {
      return NextResponse.json(
        { success: false, error: 'Невірний тип заявки' },
        { status: 400 }
      );
    }

    let calc: CalculatorLeadRequest['calculatorData'] | undefined;
    if (body.type === 'calculator') {
      calc = normalizeCalculatorData((body as CalculatorLeadRequest).calculatorData);
      if (!calc) {
        return NextResponse.json(
          { success: false, error: 'Неповні дані калькулятора' },
          { status: 400 }
        );
      }
    }

    // Файл — лише до простої заявки (форма «Обговорити проєкт»)
    let attachment: Attachment | undefined;
    if (file) {
      if (body.type !== 'simple') {
        return NextResponse.json({ success: false, error: 'Файл можна додати лише до простої заявки' }, { status: 400 });
      }
      const result = await readAttachment(file);
      if ('error' in result) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      attachment = result;
    }

    if (typeof body.message === 'string' && body.message.length > MAX_MESSAGE) {
      return NextResponse.json(
        { success: false, error: `Коментар задовгий (максимум ${MAX_MESSAGE} символів)` },
        { status: 400 }
      );
    }

    const utm = body.utm && typeof body.utm === 'object'
      ? {
          source: clip(body.utm.source, MAX_UTM),
          medium: clip(body.utm.medium, MAX_UTM),
          campaign: clip(body.utm.campaign, MAX_UTM),
        }
      : undefined;

    // Нормалізовані значення — і для БД, і для Telegram
    const name = body.name.trim();
    const contact = body.contact.trim();
    const message = clip(body.message, MAX_MESSAGE);
    const source = clip(body.source, MAX_SOURCE);

    const leadData: LeadCreateData = {
      name,
      contact,
      message,
      type: body.type,
      source,
      utm,
      status: 'new',
    };

    if (calc) {
      leadData.calculatorData = {
        projectType: calc.projectType,
        platform: calc.platform,
        pagesCount: calc.pagesCount,
        additionalServices: calc.additionalServices,
        urgency: calc.urgency,
        estimatedPrice: calc.estimatedPrice,
        estimatedTimeline: calc.estimatedTimeline,
      };
    }

    const payload = await getPayload({ config });

    // Спершу файл (Local API обходить access: створювати lead-files ззовні заборонено)
    let attachmentId: string | undefined;
    if (attachment) {
      const stored = await payload.create({
        collection: 'lead-files',
        data: {},
        file: attachment,
        overrideAccess: true,
      });
      attachmentId = String(stored.id);
    }

    const lead = await payload.create({
      collection: 'leads',
      data: {
        ...leadData,
        ...(attachmentId ? { attachment: attachmentId } : {}),
      } as unknown as DataFromCollectionSlug<'leads'>,
    });

    const telegramData: Lead = calc
      ? {
          type: 'calculator',
          name,
          contact,
          message,
          source,
          calculatorData: calc,
        }
      : {
          type: 'simple',
          name,
          contact,
          message,
          source,
          attachment: attachment
            ? { name: attachment.name, size: attachment.size, leadId: String(lead.id) }
            : undefined,
        };

    sendTelegramNotification(telegramData).catch((err) => {
      console.error('Telegram notification failed:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Заявка успішно відправлена',
      id: lead.id,
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { success: false, error: 'Внутрішня помилка сервера' },
      { status: 500 }
    );
  }
}
