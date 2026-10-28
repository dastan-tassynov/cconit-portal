import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AccountApiService } from '../../../core/api/account-api.service';
import { DashboardSummary } from '../../../core/api/models';
import { LanguageService } from '../../../core/i18n/language.service';

/** Мои курсы: карточки с прогрессом. Пусто — ссылка на каталог (как у образца). */
@Component({
  selector: 'app-my-courses',
  imports: [RouterLink, TranslatePipe],
  styleUrl: '../cabinet.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1 class="page__title">{{ 'CAB_MENU_COURSES' | translate }}</h1>
      @if (courses(); as list) {
        @if (list.length) {
          <div class="grid">
            @for (c of list; track c.id) {
              <a class="card course" [routerLink]="['/course', c.id]">
                <span class="course__thumb">📘</span>
                <b>{{ c.title }}</b>
                <span class="progress"><span [style.width.%]="c.progressPercent"></span></span>
                <span class="course__foot">
                  @if (c.isCompleted) {
                    <span class="pill pill--ok">{{ 'STATUS_PASSED' | translate }} · {{ c.lastScore }}%</span>
                  } @else {
                    <span class="muted">{{ c.progressPercent }}%</span>
                    <span class="link">{{ 'CAB_CONTINUE' | translate }} →</span>
                  }
                </span>
              </a>
            }
          </div>
        } @else {
          <div class="card empty">
            <span class="empty__icon">🗂</span>
            <span>{{ 'CAB_NO_COURSES' | translate }}</span>
            <a routerLink="/courses" class="link">{{ 'CAB_SEE_ALL_COURSES' | translate }} →</a>
          </div>
        }
      } @else {
        <p class="muted">{{ 'LOADING' | translate }}</p>
      }
    </div>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
    .course { display: flex; flex-direction: column; gap: 12px; text-decoration: none; color: inherit; }
    .course:hover { box-shadow: 0 8px 24px rgb(0 0 0 / .06); }
    .course__thumb { height: 90px; border-radius: 10px; background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
                     display: flex; align-items: center; justify-content: center; font-size: 36px; }
    .course__foot { display: flex; justify-content: space-between; align-items: center; }
  `,
})
export class MyCoursesComponent {
  private readonly accountApi = inject(AccountApiService);
  private readonly language = inject(LanguageService);
  protected readonly courses = signal<DashboardSummary['courses'] | null>(null);

  constructor() {
    effect(() => {
      this.language.current();
      this.accountApi.summary().subscribe({
        next: s => this.courses.set(s.courses),
        error: () => this.courses.set([]),
      });
    });
  }
}
