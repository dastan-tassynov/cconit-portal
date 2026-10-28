import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Телефоны Казахстана: всегда +7 и 10 цифр, первая из них — 7 (+7 7XX XXX XX XX).
 * В базе и в API номер хранится одной строкой без пробелов: +77071234567.
 */
export const KZ_PHONE = /^\+77\d{9}$/;

/** 10 «местных» цифр после +7 из того, что ввёл/вставил человек: 8 707…, +7 707…, 707… */
export function localDigits(raw: string | null | undefined): string {
  let digits = (raw ?? '').replace(/\D/g, '');
  // 8 или 7 в начале — это код страны, если цифр больше 10 (вставили номер целиком)
  if (digits.length > 10 && (digits[0] === '8' || digits[0] === '7')) digits = digits.slice(1);
  // привычная «восьмёрка» в начале: 8 707… → 707…
  while (digits.startsWith('8')) digits = digits.slice(1);
  return digits.slice(0, 10);
}

/** Значение для формы/API: '' или +7XXXXXXXXXX (неполный номер тоже — его подсветит валидатор). */
export function toPhoneValue(local: string): string {
  return local ? '+7' + local : '';
}

/** (707) 123-45-67 — по мере ввода. */
export function formatLocal(local: string): string {
  const d = local;
  if (!d) return '';
  let out = '(' + d.slice(0, 3);
  if (d.length >= 3) out += ')';
  if (d.length > 3) out += ' ' + d.slice(3, 6);
  if (d.length > 6) out += '-' + d.slice(6, 8);
  if (d.length > 8) out += '-' + d.slice(8, 10);
  return out;
}

/** +7 (707) 123-45-67 для показа; что не похоже на номер РК — как есть. */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return '';
  return KZ_PHONE.test(value) ? '+7 ' + formatLocal(value.slice(2)) : value;
}

/** Пусто — можно (если не required), иначе строго +7 7XX XXX XX XX. */
export function phoneValidator(required = false): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '') as string;
    if (!value) return required ? { required: true } : null;
    if (KZ_PHONE.test(value)) return null;
    const local = value.replace(/^\+7/, '');
    return local && local[0] !== '7' ? { phonePrefix: true } : { phone: true };
  };
}

/** Ключ перевода для ошибки поля телефона. */
export function phoneErrorKey(errors: ValidationErrors | null): string {
  if (!errors) return '';
  if (errors['required']) return 'VALIDATION_PHONE_REQUIRED';
  return errors['phonePrefix'] ? 'VALIDATION_PHONE_PREFIX' : 'VALIDATION_PHONE';
}

/** Привести сохранённый ранее номер (8 707…, +7 (707)…) к +7XXXXXXXXXX перед подстановкой в форму. */
export function normalizePhone(raw: string | null | undefined): string {
  return toPhoneValue(localDigits(raw));
}
