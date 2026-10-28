import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

export type AppLanguage = 'ru' | 'kk';

export const SUPPORTED_LANGUAGES: readonly { code: AppLanguage; label: string; flag: string }[] = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'kk', label: 'Қазақша', flag: '🇰🇿' },
];

const STORAGE_KEY = 'lang';
const DEFAULT_LANGUAGE: AppLanguage = 'ru';

/**
 * Текущий язык интерфейса. Обёртка над ngx-translate:
 * запоминает выбор в localStorage, обновляет <html lang> и отдаёт язык как signal,
 * чтобы компоненты могли перезагружать контент с сервера при смене языка.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  readonly current = signal<AppLanguage>(DEFAULT_LANGUAGE);
  readonly languages = SUPPORTED_LANGUAGES;

  /** Вызывается один раз при старте приложения. */
  init(): Observable<unknown> {
    return this.use(this.detectInitial());
  }

  use(lang: AppLanguage): Observable<unknown> {
    this.current.set(lang);
    this.document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* приватный режим браузера — просто не запоминаем */
    }
    return this.translate.use(lang);
  }

  /** Перевод в коде (тосты, confirm). В шаблонах используйте pipe `translate`. */
  instant(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params);
  }

  private detectInitial(): AppLanguage {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (stored === 'ru' || stored === 'kk') {
      return stored;
    }
    const browser = (navigator.language || '').toLowerCase();
    return browser.startsWith('kk') || browser.startsWith('kz') ? 'kk' : DEFAULT_LANGUAGE;
  }
}
