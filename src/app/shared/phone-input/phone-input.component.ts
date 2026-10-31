import { ChangeDetectionStrategy, Component, ElementRef, forwardRef, input, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { formatLocal, localDigits, toPhoneValue } from '../../core/utils/phone';

/**
 * Поле телефона РК: «+7» стоит намертво, дальше вводятся только 10 цифр по маске (7XX) XXX-XX-XX.
 * Вставка «8 707 123 45 67» или «+7 707…» приводится к тому же виду. Значение формы — +77071234567.
 * Внешний вид настраивается переменными: --phone-bg, --phone-border, --phone-radius, --phone-padding.
 */
@Component({
  selector: 'app-phone-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhoneInputComponent), multi: true }],
  template: `
    <label class="phone" [class.phone--disabled]="disabled()">
      <span class="phone__prefix" aria-hidden="true">+7</span>
      <input #field class="phone__input" type="tel" inputmode="numeric" autocomplete="tel-national"
             [id]="inputId()" [attr.aria-label]="ariaLabel()" placeholder="(7__) ___-__-__"
             [value]="display()" [disabled]="disabled()"
             (input)="onInput($event)" (keydown)="onKeydown($event)" (blur)="onTouched()">
    </label>
  `,
  styles: `
    :host { display: block; }
    .phone { display: flex; align-items: center; gap: 6px; width: 100%; box-sizing: border-box; cursor: text;
             padding: var(--phone-padding, 11px 12px); border: 1px solid var(--phone-border, #d4d4de);
             border-radius: var(--phone-radius, 10px); background: var(--phone-bg, #f6f6f9); }
    .phone:focus-within { border-color: #1b4f8a; box-shadow: 0 0 0 3px rgb(27 79 138 / .12); background: #fff; }
    .phone--disabled { opacity: .6; cursor: default; }
    .phone__prefix { font-weight: 700; color: #1e1e2f; user-select: none; }
    .phone__input { flex: 1; min-width: 0; border: 0; outline: 0; padding: 0; background: transparent; font: inherit;
                    letter-spacing: .02em; }
  `,
})
export class PhoneInputComponent implements ControlValueAccessor {
  readonly inputId = input<string>();
  readonly ariaLabel = input<string>();

  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');
  protected readonly display = signal('');
  protected readonly disabled = signal(false);
  private local = '';
  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.local = localDigits(value);
    this.display.set(formatLocal(this.local));
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  protected onInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    // сколько цифр стояло до курсора — чтобы курсор не прыгал в конец при правке в середине
    const caret = el.selectionStart ?? el.value.length;
    const digitsBeforeCaret = el.value.slice(0, caret).replace(/\D/g, '').length;
    const typed = el.value;

    this.local = localDigits(typed);
    const formatted = formatLocal(this.local);
    el.value = formatted;
    this.display.set(formatted);
    this.onChange(toPhoneValue(this.local));

    const shift = typed.replace(/\D/g, '').length - this.local.length; // отброшенная «8» в начале
    el.setSelectionRange(...this.caretRange(formatted, Math.max(0, digitsBeforeCaret - Math.max(0, shift))));
  }

  /** Backspace сразу после «)», «-» или пробела стирает цифру, а не разделитель. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Backspace') return;
    const el = event.target as HTMLInputElement;
    const pos = el.selectionStart ?? 0;
    if (pos !== el.selectionEnd || pos === 0) return;
    const before = el.value.slice(0, pos);
    if (/\D$/.test(before)) {
      event.preventDefault();
      const digitIndex = before.replace(/\D/g, '').length; // стираем последнюю цифру слева от курсора
      if (digitIndex === 0) return;
      this.local = this.local.slice(0, digitIndex - 1) + this.local.slice(digitIndex);
      const formatted = formatLocal(this.local);
      el.value = formatted;
      this.display.set(formatted);
      this.onChange(toPhoneValue(this.local));
      el.setSelectionRange(...this.caretRange(formatted, digitIndex - 1));
    }
  }

  focus(): void {
    this.field().nativeElement.focus();
  }

  private caretRange(formatted: string, digits: number): [number, number] {
    if (digits <= 0) return [formatted.startsWith('(') ? 1 : 0, formatted.startsWith('(') ? 1 : 0];
    let seen = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i]) && ++seen === digits) return [i + 1, i + 1];
    }
    return [formatted.length, formatted.length];
  }
}
