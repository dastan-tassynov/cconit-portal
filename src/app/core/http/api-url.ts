import { environment } from '../../../environments/environment';

/** Полный URL к API: api('/api/student/...'). Абсолютные ссылки не трогает. */
export function api(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return environment.apiUrl.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path);
}

export function isApiRequest(url: string): boolean {
  return url.startsWith(environment.apiUrl);
}
