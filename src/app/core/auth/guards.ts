import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../api/models';
import { SurveyStatusService } from '../account/survey-status.service';
import { SessionService } from './session.service';

/** Только для вошедших. Иначе — на страницу входа с возвратом обратно. */
export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionService);
  return session.isLoggedIn()
    ? true
    : inject(Router).createUrlTree(['/auth'], { queryParams: { returnUrl: state.url } });
};

/** Страницы входа/регистрации для уже вошедшего пользователя не нужны. */
export const guestGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  return session.isLoggedIn() ? inject(Router).createUrlTree(['/profile']) : true;
};

/** Проверка роли для меню. Настоящую проверку прав всё равно делает бэкенд. */
export function roleGuard(...roles: UserRole[]): CanActivateFn {
  return () => {
    const session = inject(SessionService);
    return session.hasAnyRole(...roles) ? true : inject(Router).createUrlTree(['/profile']);
  };
}

/**
 * Перед обучением студент заполняет анкету (как в Telegram-боте).
 * Сотрудникам анкета не нужна. Если проверить не удалось — не блокируем.
 */
export const surveyGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionService);
  if (session.isAdmin()) {
    return true;
  }
  const router = inject(Router);
  return inject(SurveyStatusService)
    .isCompleted()
    .pipe(
      map(done => (done ? true : router.createUrlTree(['/profile/survey'], { queryParams: { returnUrl: state.url } }))),
      catchError(() => of(true)),
    );
};
