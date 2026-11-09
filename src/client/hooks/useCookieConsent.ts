'use client';

import { useSyncExternalStore } from 'react';

/**
 * Згода на аналітичні cookies, збережена в localStorage.
 * useSyncExternalStore замість useEffect + setState: без зайвого рендеру
 * і без розбіжності між сервером і клієнтом при гідрації.
 */
const STORAGE_KEY = 'abect_cookie_consent';
const CHANGE_EVENT = 'abect:cookie-consent';

export type CookieConsent = 'accepted' | 'declined' | null;
/** `unknown` — на сервері та під час гідрації (localStorage ще недоступний). */
export type CookieConsentState = CookieConsent | 'unknown';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function getSnapshot(): CookieConsent {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'accepted' || value === 'declined' ? value : null;
  } catch {
    return null;
  }
}

function getServerSnapshot(): CookieConsentState {
  return 'unknown';
}

export function useCookieConsent(): CookieConsentState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setCookieConsent(decision: 'accepted' | 'declined'): void {
  try {
    localStorage.setItem(STORAGE_KEY, decision);
  } catch {
    // приватний режим / заблоковане сховище — просто сховаємо банер до перезавантаження
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
