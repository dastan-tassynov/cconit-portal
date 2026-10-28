import { HttpErrorResponse } from '@angular/common/http';

/** Машинный код ошибки от бэкенда ({code}), например EMAIL_NOT_VERIFIED. */
export function errorCode(error: unknown): string | null {
  return error instanceof HttpErrorResponse && typeof error.error?.code === 'string' ? error.error.code : null;
}

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
