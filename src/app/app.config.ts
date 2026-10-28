import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';

import { registerLocaleData } from '@angular/common';
import localeKk from '@angular/common/locales/kk';
import localeRu from '@angular/common/locales/ru';
import { routes } from './app.routes';
import { apiInterceptor } from './core/http/api.interceptor';
import { LanguageService } from './core/i18n/language.service';

// Названия дней и месяцев для DatePipe на русском и казахском
registerLocaleData(localeRu, 'ru');
registerLocaleData(localeKk, 'kk');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Числа и суммы в казахстанском формате: «15 000 ₸», а не «15,000»
    { provide: LOCALE_ID, useValue: 'ru' },
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    provideHttpClient(withFetch(), withInterceptors([apiInterceptor])),
    provideTranslateService({
      loader: provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
      fallbackLang: 'ru',
    }),
    // Ждём загрузки словаря до первого рендера — без «мигания» ключей вместо текста
    provideAppInitializer(() => firstValueFrom(inject(LanguageService).init())),
  ],
};
