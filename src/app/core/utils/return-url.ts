/** Разрешаем возвращаться только на внутренние страницы (защита от open redirect). */
export function safeReturnUrl(url: string | null | undefined, fallback = '/profile'): string {
  if (!url || !url.startsWith('/') || url.startsWith('//') || url.startsWith('/\\')) {
    return fallback;
  }
  return url;
}
