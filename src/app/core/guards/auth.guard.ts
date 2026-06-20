import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true; // Пользователь авторизован, пускаем дальше
  } else {
    // Не авторизован — принудительно отправляем на страницу логина
    router.navigate(['/auth']);
    return false;
  }
};
