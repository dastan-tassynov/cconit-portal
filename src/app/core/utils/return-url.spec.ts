import { safeReturnUrl } from './return-url';

describe('safeReturnUrl', () => {
  it('keeps internal paths', () => {
    expect(safeReturnUrl('/dashboard?buy=5')).toBe('/dashboard?buy=5');
  });

  it('rejects external and protocol-relative urls', () => {
    expect(safeReturnUrl('https://evil.example')).toBe('/profile');
    expect(safeReturnUrl('//evil.example')).toBe('/profile');
    expect(safeReturnUrl('/\\evil.example')).toBe('/profile');
  });

  it('falls back when empty', () => {
    expect(safeReturnUrl(undefined, '/')).toBe('/');
  });
});
