import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CourseApiService } from '../../core/api/course-api.service';
import { QuizAttempt, QuizResult } from '../../core/api/models';
import { errorMessage } from '../../core/http/error-message';
import { ToastService } from '../../core/ui/toast.service';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher.component';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

/**
 * Итоговый тест. Вопросы выдаёт сервер (попытка), он же считает результат —
 * на фронте нет ни правильных ответов, ни подсчёта баллов.
 * Язык вопросов фиксируется на старте попытки: смена языка посреди теста их не перегенерирует.
 */
@Component({
  selector: 'app-quiz',
  imports: [TranslatePipe, LanguageSwitcherComponent],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizComponent implements OnInit {
  private readonly courseApi = inject(CourseApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Параметр маршрута quiz/:courseId */
  readonly courseId = input.required<string>();

  protected readonly letters = OPTION_LETTERS;
  protected readonly attempt = signal<QuizAttempt | null>(null);
  protected readonly index = signal(0);
  protected readonly answers = signal<Record<number, number>>({});
  protected readonly result = signal<QuizResult | null>(null);
  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly error = signal('');
  /** Попытки закончились — тест откроет администратор. */
  protected readonly locked = signal(false);

  protected readonly questions = computed(() => this.attempt()?.questions ?? []);
  protected readonly question = computed(() => this.questions()[this.index()] ?? null);
  protected readonly isLast = computed(() => this.index() === this.questions().length - 1);
  protected readonly selected = computed(() => {
    const q = this.question();
    return q ? this.answers()[q.id] ?? null : null;
  });

  ngOnInit(): void {
    this.start();
  }

  protected select(answerId: number): void {
    const q = this.question();
    if (q) {
      this.answers.update(all => ({ ...all, [q.id]: answerId }));
    }
  }

  protected previous(): void {
    this.index.update(i => Math.max(0, i - 1));
  }

  protected next(): void {
    if (this.selected() === null) return;
    if (this.isLast()) {
      this.submit();
    } else {
      this.index.update(i => i + 1);
    }
  }

  /** Новая попытка — сервер выдаст новый набор вопросов. */
  protected restart(): void {
    if (this.result()?.completed) return;
    this.start();
  }

  protected goToDashboard(): void {
    this.router.navigate(['/profile/courses']);
  }

  protected goToCertificates(): void {
    this.router.navigate(['/profile/certificates']);
  }

  private start(): void {
    this.loading.set(true);
    this.error.set('');
    this.locked.set(false);
    this.result.set(null);
    this.answers.set({});
    this.index.set(0);

    this.courseApi.startQuiz(Number(this.courseId())).subscribe({
      next: attempt => {
        this.attempt.set(attempt);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 402) {
          this.router.navigate(['/courses', this.courseId()], { queryParams: { buy: 1 } });
          return;
        }
        if (err.status === 423) {
          this.locked.set(true);
          return;
        }
        // 409 — курс уже сдан, 404 — нет вопросов: показываем сообщение бэкенда
        this.error.set(errorMessage(err, 'QUIZ_LOAD_ERROR'));
      },
    });
  }

  private submit(): void {
    const attempt = this.attempt();
    if (!attempt || this.submitting()) return;
    this.submitting.set(true);

    this.courseApi.submitQuiz(Number(this.courseId()), attempt.attemptId, this.answers()).subscribe({
      next: result => {
        this.submitting.set(false);
        this.result.set(result);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        if (err.status === 423) {
          this.locked.set(true);
          return;
        }
        this.toast.error(errorMessage(err, 'QUIZ_SUBMIT_ERROR'));
      },
    });
  }
}
