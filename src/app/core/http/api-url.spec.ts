import { environment } from '../../../environments/environment';
import { api, isApiRequest } from './api-url';

describe('api url helper', () => {
  it('prefixes relative paths with the backend url', () => {
    expect(api('/api/public/courses')).toBe(environment.apiUrl + '/api/public/courses');
    expect(api('api/x')).toBe(environment.apiUrl + '/api/x');
  });

  it('leaves absolute urls untouched', () => {
    expect(api('https://cdn.example/file.mp4')).toBe('https://cdn.example/file.mp4');
  });

  it('detects requests to our api', () => {
    expect(isApiRequest(api('/api/auth/me'))).toBe(true);
    expect(isApiRequest('/i18n/ru.json')).toBe(false);
  });
});
