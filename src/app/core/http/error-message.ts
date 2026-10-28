import { HttpErrorResponse } from '@angular/common/http';

/** Текст ошибки от бэкенда ({message}) или запасной ключ перевода. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const message = error.error?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    if (error.status === 0) {
      return 'ERR_NETWORK';
    }
  }
  return fallback;
}
