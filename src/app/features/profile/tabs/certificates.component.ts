import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CourseApiService } from '../../../core/api/course-api.service';
import { CourseCard } from '../../../core/api/models';
import { LanguageService } from '../../../core/i18n/language.service';
import { ToastService } from '../../../core/ui/toast.service';
import { saveBlob } from '../../../core/utils/download';

/**
 * Сертификаты: только по сданным курсам (раньше показывались все курсы, где была хоть одна попытка,
 * и при скачивании несданного курса прилетала ошибка).
 */
@Component({
  selector: 'app-certificates',
  imports: [TranslatePipe],
  styleUrl: '../profile.shared.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3 class="section-title">{{ 'TITLE_MY_CERTS' | translate }}</h3>
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ 'TH_DISCIPLINE' | translate }}</th>
            <th>{{ 'TH_RESULT' | translate }}</th>
            <th class="text-right">{{ 'TH_ACTION' | translate }}</th>
          </tr>
        </thead>
        <tbody>
          @for (course of completed(); track course.id) {
            <tr>
              <td>{{ course.title }}</td>
              <td>{{ course.lastScore }}%</td>
              <td class="text-right">
                <button type="button" class="btn-small btn-small--green" [disabled]="downloading() === course.id"
                        (click)="download(course)">
                  📥 {{ 'BTN_DOWNLOAD' | translate }}
                </button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="3" class="muted">{{ (loading() ? 'LOADING' : 'CERTS_EMPTY') | translate }}</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class CertificatesComponent {
  private readonly courseApi = inject(CourseApiService);
  private readonly language = inject(LanguageService);
  private readonly toast = inject(ToastService);

  private readonly courses = signal<CourseCard[]>([]);
  protected readonly completed = computed(() => this.courses().filter(c => c.isCompleted));
  protected readonly loading = signal(true);
  protected readonly downloading = signal<number | null>(null);

  constructor() {
    effect(() => {
      this.language.current();
      this.courseApi.getMyCourses().subscribe({
        next: courses => {
          this.courses.set(courses);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });
  }

  protected download(course: CourseCard): void {
    this.downloading.set(course.id);
    this.courseApi.downloadCertificate(course.id).subscribe({
      next: blob => {
        saveBlob(blob, `${this.language.instant('CERT_FILE_PREFIX')}_${course.title}.pdf`);
        this.downloading.set(null);
      },
      error: () => {
        this.toast.error('CERT_DOWNLOAD_ERROR');
        this.downloading.set(null);
      },
    });
  }
}
