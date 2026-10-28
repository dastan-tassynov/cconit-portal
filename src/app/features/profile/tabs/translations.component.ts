import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminApiService } from '../../../core/api/admin-api.service';
import { AdminLesson, ConstructorSubject, ContentLanguage } from '../../../core/api/models';
import { errorMessage } from '../../../core/http/error-message';
import { ToastService } from '../../../core/ui/toast.service';

/** Переводы контента курса на второй язык (RU ↔ KZ). */
@Component({
  selector: 'app-translations',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './translations.component.html',
  styleUrl: '../profile.shared.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranslationsComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly subjects = signal<ConstructorSubject[]>([]);
  protected readonly lessons = signal<AdminLesson[]>([]);
  protected readonly saving = signal(false);

  protected readonly courseForm = this.fb.group({
    subjectId: this.fb.control<number | null>(null, Validators.required),
    language: this.fb.control<ContentLanguage>('KZ'),
    title: ['', Validators.required],
    description: [''],
    objectives: [''],
  });

  protected readonly lessonForm = this.fb.group({
    subjectId: this.fb.control<number | null>(null, Validators.required),
    lessonId: this.fb.control<number | null>(null, Validators.required),
    language: this.fb.control<ContentLanguage>('KZ'),
    title: ['', Validators.required],
    textMaterial: [''],
  });

  ngOnInit(): void {
    this.loadSubjects();

    // Подсказываем язык, которого у курса ещё нет
    this.courseForm.controls.subjectId.valueChanges.subscribe(id => {
      const subject = this.subjects().find(s => s.id === id);
      if (subject) {
        this.courseForm.controls.language.setValue(subject.hasKz && !subject.hasRu ? 'RU' : 'KZ');
      }
    });

    this.lessonForm.controls.subjectId.valueChanges.subscribe(id => {
      this.lessonForm.controls.lessonId.setValue(null);
      this.lessons.set([]);
      if (id) {
        this.adminApi.getLessons(id).subscribe(lessons => this.lessons.set(lessons));
      }
    });
  }

  protected saveCourseTranslation(): void {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      return;
    }
    const v = this.courseForm.getRawValue();
    this.saving.set(true);
    this.adminApi.saveSubjectTranslation(v.subjectId!, {
      language: v.language,
      title: v.title.trim(),
      description: v.description,
      objectives: v.objectives,
    }).subscribe({
      next: () => {
        this.done();
        this.courseForm.patchValue({ title: '', description: '', objectives: '' });
        this.courseForm.markAsUntouched();
        this.loadSubjects();
      },
      error: err => this.fail(err),
    });
  }

  protected saveLessonTranslation(): void {
    if (this.lessonForm.invalid) {
      this.lessonForm.markAllAsTouched();
      return;
    }
    const v = this.lessonForm.getRawValue();
    this.saving.set(true);
    this.adminApi.saveLessonTranslation(v.lessonId!, {
      language: v.language,
      title: v.title.trim(),
      textMaterial: v.textMaterial,
    }).subscribe({
      next: () => {
        this.done();
        this.lessonForm.patchValue({ lessonId: null, title: '', textMaterial: '' });
        this.lessonForm.markAsUntouched();
      },
      error: err => this.fail(err),
    });
  }

  private loadSubjects(): void {
    this.adminApi.getSubjects().subscribe(subjects => this.subjects.set(subjects));
  }

  private done(): void {
    this.saving.set(false);
    this.toast.success('TOAST_TRANSLATION_SAVED');
  }

  private fail(err: unknown): void {
    this.saving.set(false);
    this.toast.error(errorMessage(err, 'ERR_GENERIC'));
  }
}
