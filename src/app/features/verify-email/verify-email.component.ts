import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Subscription, interval } from 'rxjs';
import { AuthApiService } from '../../core/api/auth-api.service';
import { errorCode, errorMessage } from '../../core/http/error-message';
import { safeReturnUrl } from '../../core/utils/return-url';
import { FooterComponent } from '../../shared/footer/footer.component';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher.component';

const RESEND_SECONDS = 60;

/** Подтверждение e-mail: 4 цифры из письма. После успеха — сразу вход. */
@Component({
  selector: 'app-verify-email',
  imports: [RouterLink, TranslatePipe, FooterComponent, LanguageSwitcherComponent],
  styleUrls: ['../auth/auth.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-container">
      <div class="auth-language"><app-language-switcher /></div>
      <div class="auth-card">
        <a routerLink="/" class="auth-logo"><div class="logo-dot"></div><span>ЦОНИТ</span></a>
        <h2 class="auth-title">{{ 'VERIFY_TITLE' | translate }}</h2>
        <p class="auth-subtitle">{{ 'VERIFY_SENT_TO' | translate }} <b>{{ email() }}</b></p>

        <form class="code" (submit)="$event.preventDefault(); submit()">
          @for (i of slots; track i) {
            <input #digit class="code__digit" inputmode="numeric" autocomplete="one-time-code"
                   [attr.aria-label]="('VERIFY_DIGIT' | translate) + ' ' + (i + 1)"
                   [value]="digits()[i]" (input)="onInput(i, $event)" (keydown)="onKey(i, $event)" (paste)="onPaste($event)">
          }
        </form>

        @if (error()) { <p class="code__error" role="alert">{{ error() | translate }}</p> }

        <button type="button" class="btn-submit" [disabled]="loading() || code().length < 4" (click)="submit()">
          {{ (loading() ? 'LOADING' : 'VERIFY_SUBMIT') | translate }}
        </button>

        <p class="code__hint">
          {{ 'VERIFY_NO_EMAIL' | translate }}
          @if (cooldown() > 0) {
            <span class="muted">{{ 'VERIFY_RESEND_IN' | translate: { seconds: cooldown() } }}</span>
          } @else {
            <button type="button" class="link-btn" (click)="resend()">{{ 'VERIFY_RESEND' | translate }}</button>
          }
        </p>
        @if (info()) { <p class="code__info">{{ info() | translate }}</p> }
        <p class="code__hint"><a routerLink="/register">{{ 'VERIFY_WRONG_EMAIL' | translate }}</a></p>
      </div>
    </div>
    <app-footer />
  `,
  styles: `
    .code { display: flex; gap: 12px; justify-content: center; margin: 24px 0 12px; }
    .code__digit { width: 56px; height: 64px; text-align: center; font-size: 28px; font-weight: 700; border: 1px solid #cbd5e1;
                   border-radius: 12px; background: #f8fafc; }
    .code__digit:focus { outline: none; border-color: #3d37f0; box-shadow: 0 0 0 3px rgb(61 55 240 / .15); background: #fff; }
    .code__error { color: #dc2626; text-align: center; margin: 0 0 12px; }
    .code__info { color: #059669; text-align: center; margin: 8px 0 0; }
    .code__hint { text-align: center; color: #64748b; margin: 16px 0 0; font-size: 14px; }
    .link-btn { background: none; border: 0; color: #3d37f0; font-weight: 600; cursor: pointer; padding: 0; font: inherit; }
    .muted { color: #94a3b8; }
  `,
})
export class VerifyEmailComponent implements AfterViewInit {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly inputs = viewChildren<ElementRef<HTMLInputElement>>('digit');

  readonly email = input<string>('');
  readonly returnUrl = input<string>();

  protected readonly slots = [0, 1, 2, 3];
  protected readonly digits = signal(['', '', '', '']);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly info = signal('');
  protected readonly cooldown = signal(RESEND_SECONDS);
  private timer?: Subscription;

  protected code(): string {
    return this.digits().join('');
  }

  ngAfterViewInit(): void {
    if (!this.email()) {
      this.router.navigate(['/register']);
      return;
    }
    this.startCooldown();
    this.focus(0);
    this.destroyRef.onDestroy(() => this.timer?.unsubscribe());
  }

  protected onInput(i: number, event: Event): void {
    const el = event.target as HTMLInputElement;
    const typed = el.value.replace(/\D/g, '');
    this.error.set('');
    if (typed.length > 1) {
      // автоподстановка кода из письма (one-time-code) или быстрый ввод — раскладываем по клеткам
      this.fillFrom(i, typed);
      return;
    }
    el.value = typed;
    this.digits.update(d => d.map((x, j) => (j === i ? typed : x)));
    if (typed && i < 3) this.focusNow(i + 1);
    if (this.code().length === 4) this.submit();
  }

  private fillFrom(start: number, text: string): void {
    const next = [...this.digits()];
    for (let k = 0; k < text.length && start + k < 4; k++) next[start + k] = text[k];
    this.digits.set(next);
    this.inputs().forEach((ref, j) => (ref.nativeElement.value = next[j]));
    const empty = next.findIndex(x => !x);
    if (empty === -1) this.submit(); else this.focusNow(empty);
  }

  protected onKey(i: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.digits()[i] && i > 0) this.focus(i - 1);
  }

  protected onPaste(event: ClipboardEvent): void {
    const text = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 4);
    if (!text) return;
    event.preventDefault();
    this.digits.set(['', '', '', '']);
    this.fillFrom(0, text);
  }

  protected submit(): void {
    if (this.loading() || this.code().length < 4) return;
    this.loading.set(true);
    this.authApi.verifyEmail(this.email(), this.code()).subscribe({
      next: () => this.router.navigateByUrl(safeReturnUrl(this.returnUrl())),
      error: err => {
        this.loading.set(false);
        this.error.set(errorMessage(err, 'ERR_GENERIC'));
        this.digits.set(['', '', '', '']);
        this.focus(0);
        if (errorCode(err) === 'CODE_EXPIRED') this.cooldown.set(0);
      },
    });
  }

  protected resend(): void {
    this.info.set('');
    this.error.set('');
    this.authApi.resendCode(this.email()).subscribe({
      next: () => {
        this.info.set('VERIFY_RESENT');
        this.startCooldown();
      },
      error: err => this.error.set(errorMessage(err, 'ERR_GENERIC')),
    });
  }

  private startCooldown(): void {
    this.timer?.unsubscribe();
    this.cooldown.set(RESEND_SECONDS);
    this.timer = interval(1000).subscribe(() => {
      this.cooldown.update(s => Math.max(0, s - 1));
      if (this.cooldown() === 0) this.timer?.unsubscribe();
    });
  }

  /** После перерисовки (первый показ, сброс после ошибки). */
  private focus(i: number): void {
    setTimeout(() => this.focusNow(i));
  }

  /** Сразу — иначе быстро набранные цифры попадают в старую клетку и теряются. */
  private focusNow(i: number): void {
    const el = this.inputs()[i]?.nativeElement;
    el?.focus();
    el?.select();
  }
}
