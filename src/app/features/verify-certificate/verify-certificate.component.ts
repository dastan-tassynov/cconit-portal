import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CourseApiService } from '../../core/api/course-api.service';
import { CertificateVerification } from '../../core/api/models';
import { LanguageService } from '../../core/i18n/language.service';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher.component';

/** Публичная проверка подлинности сертификата (по ссылке из QR-кода). */
@Component({
  selector: 'app-verify-certificate',
  imports: [RouterLink, DatePipe, TranslatePipe, LanguageSwitcherComponent],
  templateUrl: './verify-certificate.component.html',
  styleUrl: './verify-certificate.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyCertificateComponent {
  private readonly courseApi = inject(CourseApiService);
  private readonly language = inject(LanguageService);

  readonly uuid = input.required<string>();

  protected readonly loading = signal(true);
  protected readonly certificate = signal<CertificateVerification | null>(null);
  protected readonly error = signal<'not-found' | 'network' | null>(null);

  constructor() {
    effect(() => this.verify(this.uuid(), this.language.current()));
  }

  private verify(uuid: string, _lang: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.courseApi.verifyCertificate(uuid).subscribe({
      next: cert => {
        this.certificate.set(cert);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.certificate.set(null);
        this.error.set(err.status === 404 ? 'not-found' : 'network');
        this.loading.set(false);
      },
    });
  }
}
