import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionService } from '../auth/session.service';
import { LanguageService } from '../i18n/language.service';
import { isApiRequest } from './api-url';

/**
 * Для всех запросов к нашему API:
 * - добавляет Bearer-токен и язык (Accept-Language) — больше не нужно делать это в каждом компоненте;
 * - при 401 завершает сессию и отправляет на страницу входа.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }
  const session = inject(SessionService);
  const language = inject(LanguageService);
  const router = inject(Router);

  const token = session.token;
  const request = req.clone({
    setHeaders: {
      'Accept-Language': language.current(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && token) {
        session.clear();
        router.navigate(['/auth'], { queryParams: { returnUrl: router.url } });
      }
      return throwError(() => error);
    }),
  );
};
