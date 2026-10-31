import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { CourseApiService } from '../../core/api/course-api.service';
import { CourseLessons, Lesson } from '../../core/api/models';
import { SessionService } from '../../core/auth/session.service';
import { api } from '../../core/http/api-url';
import { LanguageService } from '../../core/i18n/language.service';
import { ToastService } from '../../core/ui/toast.service';
import { isHtml } from '../../core/utils/word-import';
import { FooterComponent } from '../../shared/footer/footer.component';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher.component';

type ViewMode = 'syllabus' | 'lesson';

@Component({
  selector: 'app-course-view',
  imports: [TranslatePipe, FooterComponent, LanguageSwitcherComponent],
  templateUrl: './course-view.component.html',
  styleUrl: './course-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseViewComponent {
  protected readonly isHtml = isHtml;
  private readonly courseApi = inject(CourseApiService);
  private readonly language = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  protected readonly session = inject(SessionService);

  /** Параметр маршрута course/:id */
  readonly id = input.required<string>();
  private readonly courseId = computed(() => Number(this.id()));

  protected readonly course = signal<CourseLessons | null>(null);
  protected readonly lessons = computed<Lesson[]>(() =>
    [...(this.course()?.lessons ?? [])].sort((a, b) => a.stepOrder - b.stepOrder));
  protected readonly lastStep = computed(() => this.lessons().at(-1)?.stepOrder ?? 0);

  protected readonly maxAvailableStep = signal(1);
  protected readonly courseFinished = signal(false);
  /** Попытки теста закончились — нужна разблокировка администратором. */
  protected readonly quizLocked = signal(false);
  protected readonly viewMode = signal<ViewMode>('syllabus');
  protected readonly currentLesson = signal<Lesson | null>(null);
  protected readonly completionModalOpen = signal(false);
  protected readonly blockedModalOpen = signal(false);
  protected readonly watermark = signal({ top: '10%', left: '15%' });

  constructor() {
    // Загрузка курса; при смене языка — повторно, с сохранением открытого урока
    effect(() => this.load(this.courseId(), this.language.current()));
  }

  protected videoSrc(lesson: Lesson): string | null {
    return lesson.videoUrl ? api(lesson.videoUrl) : null;
  }

  protected isDone(lesson: Lesson): boolean {
    return lesson.stepOrder < this.maxAvailableStep();
  }

  protected isLocked(lesson: Lesson): boolean {
    return lesson.stepOrder > this.maxAvailableStep();
  }

  protected openLesson(lesson: Lesson): void {
    if (this.isLocked(lesson)) {
      this.toast.info('COURSE_MODULE_LOCKED');
      return;
    }
    this.currentLesson.set(lesson);
    this.moveWatermark();
    this.viewMode.set('lesson');
    window.scrollTo({ top: 0 });
  }

  protected showSyllabus(): void {
    this.viewMode.set('syllabus');
    this.currentLesson.set(null);
  }

  protected nextStep(): void {
    if (this.courseFinished()) {
      this.blockedModalOpen.set(true);
      return;
    }
    const current = this.currentLesson();
    const next = this.lessons().find(l => l.stepOrder > (current?.stepOrder ?? 0));
    if (!next) {
      this.completionModalOpen.set(true);
      return;
    }
    this.courseApi.advanceToStep(this.courseId(), next.stepOrder).subscribe({
      next: progress => {
        this.maxAvailableStep.set(Math.max(this.maxAvailableStep(), progress.currentStepOrder));
        this.openLesson(next);
      },
      error: () => this.toast.error('COURSE_PROGRESS_SAVE_ERROR'),
    });
  }

  protected goToQuiz(): void {
    this.completionModalOpen.set(false);
    this.router.navigate(['/quiz', this.courseId()]);
  }

  protected goToDashboard(): void {
    this.completionModalOpen.set(false);
    this.router.navigate(['/profile/courses']);
  }

  protected onVideoError(): void {
    this.toast.error('COURSE_VIDEO_ERROR');
  }

  private load(courseId: number, _lang: string): void {
    forkJoin({
      course: this.courseApi.getLessons(courseId),
      progress: this.courseApi.getProgress(courseId),
    }).subscribe({
      next: ({ course, progress }) => {
        this.course.set(course);
        this.maxAvailableStep.set(progress.currentStepOrder || 1);
        this.courseFinished.set(progress.isCompleted);
        this.quizLocked.set(progress.quizLocked);
        // Открытый урок обновляем (новый язык и свежая ссылка на видео)
        const opened = this.currentLesson();
        if (opened) {
          this.currentLesson.set(course.lessons.find(l => l.id === opened.id) ?? null);
        }
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 402) {
          this.toast.info('COURSE_NOT_PURCHASED');
          this.router.navigate(['/courses', courseId], { queryParams: { buy: 1 } });
        } else {
          this.toast.error('COURSE_LOAD_ERROR');
        }
      },
    });
  }

  private moveWatermark(): void {
    this.watermark.set({
      top: Math.floor(Math.random() * 60 + 10) + '%',
      left: Math.floor(Math.random() * 60 + 10) + '%',
    });
  }
}
