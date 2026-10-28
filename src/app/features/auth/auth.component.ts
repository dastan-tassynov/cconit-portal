import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthApiService } from '../../core/api/auth-api.service';
import { errorCode, errorMessage } from '../../core/http/error-message';
import { safeReturnUrl } from '../../core/utils/return-url';
import { FooterComponent } from '../../shared/footer/footer.component';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher.component';

@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, FooterComponent, LanguageSwitcherComponent],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  /** ?returnUrl=... из guard'а или публичной страницы. */
  readonly returnUrl = input<string>();

  protected readonly form = inject(FormBuilder).nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.authApi.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl(safeReturnUrl(this.returnUrl())),
      error: err => {
        this.loading.set(false);
        if (errorCode(err) === 'EMAIL_NOT_VERIFIED') {
          // Почта не подтверждена: отправляем свежий код и ведём на ввод кода
          const email = this.form.controls.username.value.trim();
          this.authApi.resendCode(email).subscribe({ error: () => undefined });
          this.router.navigate(['/verify-email'], { queryParams: { email, returnUrl: this.returnUrl() || null } });
          return;
        }
        this.error.set(errorMessage(err, 'AUTH_INVALID_CREDENTIALS'));
      },
    });
  }
}
