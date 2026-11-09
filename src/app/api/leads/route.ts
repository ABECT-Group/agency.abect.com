import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import type { DataFromCollectionSlug } from 'payload';
import config from '@payload-config';
import { sendTelegramNotification } from '@/utils/telegram';
import type { Lead } from '@/utils/telegram';

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
    const body: LeadRequest = await request.json();

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

    const lead = await payload.create({
      collection: 'leads',
      data: leadData as unknown as DataFromCollectionSlug<'leads'>,
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
