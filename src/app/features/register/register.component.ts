import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthApiService } from '../../core/api/auth-api.service';
import { errorMessage } from '../../core/http/error-message';
import { safeReturnUrl } from '../../core/utils/return-url';
import { FooterComponent } from '../../shared/footer/footer.component';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher.component';

type RegisterField = 'fullName' | 'iin' | 'email' | 'password' | 'confirmPassword';

/** Пароль и подтверждение должны совпадать. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, FooterComponent, LanguageSwitcherComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  readonly returnUrl = input<string>();

  /** Правила совпадают с валидацией на бэкенде (RegisterRequest). */
  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.maxLength(200)]],
      iin: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected invalid(name: RegisterField): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  protected submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.loading.set(true);
    this.error.set('');

    this.authApi
      .register({
        username: value.email.trim(),
        iin: value.iin,
        fullName: value.fullName.trim(),
        password: value.password,
      })
      .subscribe({
        next: response => {
          // Код отключён на сервере — уже вошли
          if (!response.verificationRequired) {
            this.router.navigateByUrl(safeReturnUrl(this.returnUrl()));
            return;
          }
          // На почту ушёл 4-значный код — подтверждаем e-mail, после этого вход
          this.router.navigate(['/verify-email'], {
            queryParams: { email: value.email.trim(), returnUrl: this.returnUrl() || null },
          });
        },
        error: err => {
          this.loading.set(false);
          this.error.set(errorMessage(err, 'AUTH_REGISTER_ERROR'));
        },
      });
  }
}
