import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { CourseApiService } from '../../../core/api/course-api.service';
import { MyCertificate } from '../../../core/api/models';
import { LanguageService } from '../../../core/i18n/language.service';
import { ToastService } from '../../../core/ui/toast.service';
import { saveBlob } from '../../../core/utils/download';

type DocKind = 'certificate' | 'appendix';

/**
 * Мои сертификаты — как в Telegram-боте: сертификат и приложение к нему (модули и часы).
 * Список берётся из выданных сертификатов, а не из каталога, поэтому не зависит от языка интерфейса.
 */
@Component({
  selector: 'app-certificates',
  imports: [TranslatePipe, DatePipe],
  styleUrl: '../profile.shared.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3 class="section-title">{{ 'TITLE_MY_CERTS' | translate }}</h3>
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ 'TH_COURSE' | translate }}</th>
            <th>{{ 'CERT_NUMBER' | translate }}</th>
            <th>{{ 'CERT_ISSUED' | translate }}</th>
            <th>{{ 'CERT_HOURS' | translate }}</th>
            <th>{{ 'TH_RESULT' | translate }}</th>
            <th class="text-right">{{ 'TH_ACTION' | translate }}</th>
          </tr>
        </thead>
        <tbody>
          @for (c of certificates(); track c.subjectId) {
            <tr>
              <td>
                {{ c.courseTitle }}<br>
                <small class="muted">{{ (c.inRegistry ? 'CERT_IN_REGISTRY' : 'CERT_REGISTRY_PENDING') | translate }}</small>
              </td>
              <td>№ {{ c.certificateNumber }}</td>
              <td>{{ c.issuedAt | date: 'dd.MM.yyyy' }}</td>
              <td>{{ c.hours ?? '—' }}</td>
              <td>{{ c.score != null ? c.score + '%' : '—' }}</td>
              <td class="text-right actions">
                <button type="button" class="btn-small btn-small--green" [disabled]="busy() === key(c, 'certificate')"
                        (click)="download(c, 'certificate')">📥 {{ 'CERT_DOWNLOAD_CERT' | translate }}</button>
                <button type="button" class="btn-small" [disabled]="busy() === key(c, 'appendix')"
                        (click)="download(c, 'appendix')">📄 {{ 'CERT_DOWNLOAD_APPENDIX' | translate }}</button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="6" class="muted">{{ (loading() ? 'LOADING' : 'CERTS_EMPTY') | translate }}</td></tr>
          }
        </tbody>
      </table>
    </div>
    @if (certificates().length) {
      <p class="muted hint">{{ 'CERT_APPENDIX_HINT' | translate }}</p>
    }
  `,
  styles: `
    .actions { white-space: nowrap; }
    .actions .btn-small + .btn-small { margin-left: 6px; }
    .hint { margin-top: 12px; font-size: 13px; }
  `,
})
export class CertificatesComponent {
  private readonly courseApi = inject(CourseApiService);
  private readonly language = inject(LanguageService);
  private readonly toast = inject(ToastService);

  protected readonly certificates = signal<MyCertificate[]>([]);
  protected readonly loading = signal(true);
  protected readonly busy = signal<string | null>(null);

  constructor() {
    effect(() => {
      this.language.current();
      this.courseApi.myCertificates().subscribe({
        next: list => {
          this.certificates.set(list);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });
  }

  protected key(c: MyCertificate, kind: DocKind): string {
    return `${c.subjectId}:${kind}`;
  }

  protected download(c: MyCertificate, kind: DocKind): void {
    const request: Observable<Blob> = kind === 'certificate'
      ? this.courseApi.downloadCertificate(c.subjectId)
      : this.courseApi.downloadAppendix(c.subjectId);
    const prefix = this.language.instant(kind === 'certificate' ? 'CERT_FILE_PREFIX' : 'CERT_APPENDIX_PREFIX');
    this.busy.set(this.key(c, kind));
    request.subscribe({
      next: blob => {
        saveBlob(blob, `${prefix} №${c.certificateNumber}.pdf`);
        this.busy.set(null);
      },
      error: () => {
        this.toast.error('CERT_DOWNLOAD_ERROR');
        this.busy.set(null);
      },
    });
  }
}
