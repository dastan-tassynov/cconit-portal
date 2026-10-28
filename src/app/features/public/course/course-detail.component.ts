import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ContentApiService } from '../../../core/api/content-api.service';
import { CourseDetail, Order } from '../../../core/api/models';
import { SessionService } from '../../../core/auth/session.service';
import { LanguageService } from '../../../core/i18n/language.service';
import { ToastService } from '../../../core/ui/toast.service';
import { saveBlob } from '../../../core/utils/download';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { PurchaseDialogComponent } from '../../../shared/purchase-dialog/purchase-dialog.component';
import { SiteHeaderComponent } from '../../../shared/site-header/site-header.component';

/**
 * Страница курса (как у образца): описание, карточка формата с часами, ценой и прогрессом,
 * «Скачать план», «Купить» / «Продолжить», задачи курса, разработчики программы.
 */
@Component({
  selector: 'app-course-detail',
  imports: [RouterLink, DecimalPipe, TranslatePipe, SiteHeaderComponent, FooterComponent, PurchaseDialogComponent],
  templateUrl: './course-detail.component.html',
  styleUrls: ['../page.css', './course-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseDetailComponent {
  private readonly contentApi = inject(ContentApiService);
  private readonly language = inject(LanguageService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly id = input.required<string>();
  /** ?buy=1 — сразу открыть оплату (после регистрации с публичной страницы). */
  readonly buy = input<string>();

  protected readonly course = signal<CourseDetail | null>(null);
  protected readonly notFound = signal(false);
  protected readonly purchaseOpen = signal(false);
  protected readonly progress = computed(() => this.course()?.viewer?.progressPercent ?? 0);

  constructor() {
    effect(() => this.load(Number(this.id()), this.language.current()));
  }

  protected primaryAction(): void {
    const course = this.course();
    if (!course) return;
    if (!this.session.isLoggedIn()) {
      this.router.navigate(['/register'], { queryParams: { returnUrl: `/courses/${course.id}?buy=1` } });
      return;
    }
    if (course.free || course.viewer?.hasAccess) {
      this.router.navigate(['/course', course.id]);
    } else {
      this.purchaseOpen.set(true);
    }
  }

  protected actionKey(): string {
    const viewer = this.course()?.viewer;
    if (viewer?.isCompleted) return 'COURSE_ACTION_REVIEW';
    if (viewer?.enrolled) return 'COURSE_ACTION_CONTINUE';
    if (viewer?.hasAccess || this.course()?.free) return 'COURSE_ACTION_START';
    return 'COURSE_ACTION_BUY';
  }

  protected downloadPlan(): void {
    const course = this.course();
    if (!course) return;
    this.contentApi.coursePlan(course.id).subscribe({
      next: blob => saveBlob(blob, `${course.title}.pdf`),
      error: () => this.toast.error('ERR_GENERIC'),
    });
  }

  protected onPaid(order: Order): void {
    this.purchaseOpen.set(false);
    this.router.navigate(['/course', order.subjectId]);
  }

  private load(id: number, _lang: string): void {
    this.contentApi.course(id).subscribe({
      next: course => {
        this.course.set(course);
        if (this.buy() && this.session.isLoggedIn() && !course.free && !course.viewer?.hasAccess) {
          this.purchaseOpen.set(true);
          this.router.navigate([], { queryParams: { buy: null }, replaceUrl: true });
        }
      },
      error: () => this.notFound.set(true),
    });
  }
}
