import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminApiService } from '../../../core/api/admin-api.service';
import { ConstructorSubject, ContentLanguage, OrleuProgram } from '../../../core/api/models';
import { errorMessage } from '../../../core/http/error-message';
import { ToastService } from '../../../core/ui/toast.service';
import { saveBlob } from '../../../core/utils/download';
import { WordImportError, WordLesson, docxToHtml, isHtml, splitByHeadings } from '../../../core/utils/word-import';
import { concatMap, from, tap, toArray } from 'rxjs';

const ANSWER_COUNT = 4;

/** Конструктор: курсы и цены, уроки с видео, вопросы теста. */
@Component({
  selector: 'app-course-constructor',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './course-constructor.component.html',
  styleUrl: '../profile.shared.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseConstructorComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly letters = ['A', 'B', 'C', 'D'];
  protected readonly subjects = signal<ConstructorSubject[]>([]);
  /** Справочник программ Өрлеу: код курса выбирается из него, тогда курс попадает в группу предмета. */
  protected readonly orleuPrograms = signal<OrleuProgram[]>([]);
  protected readonly saving = signal<'course' | 'lesson' | 'quiz' | null>(null);
  /** Редактируемые цены: id курса → значение в поле. */
  protected readonly priceDrafts = signal<Record<number, number | null>>({});

  protected readonly courseForm = this.fb.group({
    language: this.fb.control<ContentLanguage>('RU'),
    programCode: ['', [Validators.required, Validators.maxLength(100)]],
    title: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
    hours: this.fb.control<number | null>(80, [Validators.min(0)]),
    price: this.fb.control<number | null>(null, [Validators.min(0)]),
  });

  protected readonly lessonForm = this.fb.group({
    subjectId: this.fb.control<number | null>(null, Validators.required),
    language: this.fb.control<ContentLanguage>('RU'),
    title: ['', Validators.required],
    textMaterial: [''],
  });
  protected lessonVideo: File | null = null;

  /** Импорт из Word: модули, найденные по заголовкам документа. */
  protected readonly wordLessons = signal<WordLesson[]>([]);
  protected readonly wordFileName = signal('');
  protected readonly wordBusy = signal(false);
  protected readonly wordProgress = signal(0);
  private wordHtml = '';
  protected readonly isHtml = isHtml;

  protected readonly quizForm = this.fb.group({
    subjectId: this.fb.control<number | null>(null, Validators.required),
    language: this.fb.control<ContentLanguage>('RU'),
    questionText: ['', Validators.required],
    correctIndex: [0],
    answers: this.fb.array(
      Array.from({ length: ANSWER_COUNT }, () => this.fb.control('', Validators.required)),
    ),
  });

  get answerControls(): FormArray {
    return this.quizForm.controls.answers;
  }

  /** Выбрали программу Өрлеу — подставим её название, если название курса ещё пустое. */
  protected onCodeChosen(): void {
    const code = this.courseForm.controls.programCode.value.trim().toUpperCase();
    const program = this.orleuPrograms().find(p => p.code.toUpperCase() === code);
    if (program && !this.courseForm.controls.title.value.trim()) {
      this.courseForm.controls.title.setValue(program.name);
    }
  }

  ngOnInit(): void {
    this.adminApi.orleuPrograms().subscribe({ next: p => this.orleuPrograms.set(p), error: () => this.orleuPrograms.set([]) });
    this.loadSubjects();
  }

  // ---------------------------------------------------------------- курсы

  protected createCourse(): void {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      return;
    }
    this.saving.set('course');
    const value = this.courseForm.getRawValue();
    this.adminApi.createSubject({ ...value, title: value.title.trim(), programCode: value.programCode.trim() }).subscribe({
      next: () => {
        this.toast.success('TOAST_COURSE_CREATED');
        this.courseForm.reset({ language: value.language, hours: 80 });
        this.saving.set(null);
        this.loadSubjects();
      },
      error: err => this.fail(err),
    });
  }

  protected setPriceDraft(subjectId: number, value: string): void {
    const price = value === '' ? null : Number(value);
    this.priceDrafts.update(d => ({ ...d, [subjectId]: price }));
  }

  protected savePrice(subject: ConstructorSubject): void {
    const drafts = this.priceDrafts();
    if (!(subject.id in drafts)) return;
    this.adminApi.updatePrice(subject.id, drafts[subject.id]).subscribe({
      next: () => {
        this.toast.success('TOAST_PRICE_SAVED');
        this.loadSubjects();
      },
      error: err => this.toast.error(errorMessage(err, 'ERR_GENERIC')),
    });
  }

  /** Скрыть/показать курс в каталоге (купившие доступ не теряют). */
  protected toggleHidden(subject: ConstructorSubject): void {
    this.adminApi.setHidden(subject.id, !subject.hidden).subscribe({
      next: res => {
        this.toast.success(res.message);
        this.loadSubjects();
      },
      error: err => this.toast.error(errorMessage(err, 'ERR_GENERIC')),
    });
  }

  protected downloadReport(subject: ConstructorSubject): void {
    this.adminApi.downloadReport(subject.id).subscribe({
      next: blob => saveBlob(blob, `report_${subject.programCode}_${subject.id}.xlsx`),
      error: () => this.toast.error('ERR_GENERIC'),
    });
  }

  // ---------------------------------------------------------------- уроки

  protected onVideoSelected(event: Event): void {
    this.lessonVideo = (event.target as HTMLInputElement).files?.[0] ?? null;
  }

  protected addLesson(fileInput: HTMLInputElement): void {
    if (this.lessonForm.invalid) {
      this.lessonForm.markAllAsTouched();
      return;
    }
    const value = this.lessonForm.getRawValue();
    this.saving.set('lesson');
    this.adminApi
      .createLesson(value.subjectId!, {
        language: value.language,
        title: value.title.trim(),
        textMaterial: value.textMaterial,
        video: this.lessonVideo,
      })
      .subscribe({
        next: () => {
          this.toast.success('TOAST_LESSON_CREATED');
          this.lessonForm.patchValue({ title: '', textMaterial: '' });
          this.lessonForm.markAsUntouched();
          this.lessonVideo = null;
          fileInput.value = '';
          this.saving.set(null);
        },
        error: err => this.fail(err),
      });
  }

  // ---------------------------------------------------------------- Word

  protected async onWordSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.wordBusy.set(true);
    try {
      const html = await docxToHtml(file);
      const lessons = splitByHeadings(html);
      this.wordHtml = html;
      this.wordFileName.set(file.name);
      if (lessons.length > 1) {
        // несколько разделов — предложим сразу создать модули
        this.wordLessons.set(lessons);
      } else {
        const title = lessons[0]?.title;
        this.lessonForm.patchValue({
          textMaterial: lessons.length === 1 ? lessons[0].html : html,
          ...(title && !this.lessonForm.controls.title.value.trim() ? { title } : {}),
        });
        this.toast.success('WORD_INSERTED');
      }
    } catch (e) {
      this.toast.error(e instanceof WordImportError ? e.key : 'WORD_READ_ERROR');
    } finally {
      this.wordBusy.set(false);
    }
  }

  protected useWholeDocument(): void {
    this.lessonForm.patchValue({ textMaterial: this.wordHtml });
    this.clearWord();
  }

  protected clearWord(): void {
    this.wordLessons.set([]);
    this.wordFileName.set('');
    this.wordProgress.set(0);
  }

  /** Все модули из документа — по очереди, в выбранный курс и язык. */
  protected createLessonsFromWord(): void {
    const { subjectId, language } = this.lessonForm.getRawValue();
    if (!subjectId) {
      this.lessonForm.controls.subjectId.markAsTouched();
      this.toast.error('PH_SELECT_COURSE');
      return;
    }
    this.saving.set('lesson');
    this.wordProgress.set(0);
    from(this.wordLessons())
      .pipe(
        concatMap(lesson => this.adminApi.createLesson(subjectId, {
          language,
          title: lesson.title.slice(0, 255),
          textMaterial: lesson.html,
        }).pipe(tap(() => this.wordProgress.update(n => n + 1)))),
        toArray(),
      )
      .subscribe({
        next: () => {
          this.toast.success('WORD_MODULES_CREATED');
          this.clearWord();
          this.saving.set(null);
        },
        error: err => this.fail(err),
      });
  }

  // ---------------------------------------------------------------- тест

  protected addQuestion(): void {
    if (this.quizForm.invalid) {
      this.quizForm.markAllAsTouched();
      return;
    }
    const value = this.quizForm.getRawValue();
    this.saving.set('quiz');
    this.adminApi
      .addQuizQuestion(value.subjectId!, {
        language: value.language,
        questionText: value.questionText.trim(),
        answers: value.answers.map((text, i) => ({ answerText: text.trim(), isCorrect: i === value.correctIndex })),
      })
      .subscribe({
        next: () => {
          this.toast.success('TOAST_QUESTION_CREATED');
          this.quizForm.patchValue({ questionText: '', correctIndex: 0 });
          this.answerControls.reset(Array(ANSWER_COUNT).fill(''));
          this.quizForm.markAsUntouched();
          this.saving.set(null);
        },
        error: err => this.fail(err),
      });
  }

  // ---------------------------------------------------------------- helpers

  private loadSubjects(): void {
    this.adminApi.getSubjects().subscribe({
      next: subjects => {
        this.subjects.set(subjects);
        this.priceDrafts.set({});
      },
      error: () => this.toast.error('ERR_GENERIC'),
    });
  }

  private fail(err: unknown): void {
    this.saving.set(null);
    this.toast.error(errorMessage(err, 'ERR_GENERIC'));
  }
}
