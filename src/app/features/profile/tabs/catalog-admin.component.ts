import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminApiService } from '../../../core/api/admin-api.service';
import { ConstructorSubject, OrleuProgram } from '../../../core/api/models';
import { errorMessage } from '../../../core/http/error-message';
import { ToastService } from '../../../core/ui/toast.service';

type AuthorGroup = FormGroup<{ fullName: FormControl<string>; position: FormControl<string> }>;

/** Каталог: группы-предметы из Өрлеу и страница курса (код программы, часы, задачи, разработчики, PDF-план). */
@Component({
  selector: 'app-catalog-admin',
  imports: [ReactiveFormsModule, FormsModule, TranslatePipe],
  templateUrl: './catalog-admin.component.html',
  styleUrl: '../profile.shared.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogAdminComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly subjects = signal<ConstructorSubject[]>([]);
  protected readonly selectedSubjectId = signal<number | null>(null);
  protected readonly hasPlan = signal(false);
  protected readonly orleuPrograms = signal<OrleuProgram[]>([]);
  protected readonly saving = signal(false);

  protected readonly detailsForm = this.fb.group({
    // направление больше не выбирается (группы каталога = предметы Өрлеу), но сохраняем прежнее значение
    directionId: this.fb.control<number | null>(null),
    programCode: ['', [Validators.required, Validators.maxLength(100)]],
    hours: this.fb.control<number | null>(null),
    objectives: [''],
    authors: this.fb.array<AuthorGroup>([]),
  });

  get authors(): FormArray<AuthorGroup> {
    return this.detailsForm.controls.authors;
  }

  protected readonly syncing = signal(false);

  /** «Обновить из Өрлеу» — подтянуть программы (/op), не дожидаясь ночной синхронизации. */
  protected syncPrograms(): void {
    this.syncing.set(true);
    this.adminApi.orleuSyncPrograms().subscribe({
      next: res => {
        this.syncing.set(false);
        this.toast.success(res.message);
        this.adminApi.orleuPrograms().subscribe(p => this.orleuPrograms.set(p));
      },
      error: err => {
        this.syncing.set(false);
        this.toast.error(errorMessage(err, 'ERR_GENERIC'));
      },
    });
  }

  ngOnInit(): void {
    // Справочник программ Өрлеу для подсказки кода (если интеграция недоступна — просто без подсказок)
    this.adminApi.orleuPrograms().subscribe({ next: p => this.orleuPrograms.set(p), error: () => this.orleuPrograms.set([]) });
    this.adminApi.getSubjects().subscribe(s => this.subjects.set(s));
  }

  // ---------------------------------------------------------------- детали курса

  protected selectSubject(id: number | null): void {
    this.selectedSubjectId.set(id);
    this.authors.clear();
    if (!id) return;
    this.adminApi.getSubjectDetails(id).subscribe(details => {
      this.detailsForm.patchValue({
        directionId: details.directionId ?? null,
        programCode: details.programCode ?? '',
        hours: details.hours ?? null,
        objectives: details.objectives ?? '',
      });
      details.authors.forEach(a => this.authors.push(this.authorGroup(a.fullName, a.position ?? '')));
      this.hasPlan.set(!!details.hasPlan);
    });
  }

  protected addAuthor(): void {
    this.authors.push(this.authorGroup('', ''));
  }

  protected removeAuthor(index: number): void {
    this.authors.removeAt(index);
  }

  protected saveDetails(): void {
    const id = this.selectedSubjectId();
    if (!id || this.detailsForm.invalid) {
      this.detailsForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const v = this.detailsForm.getRawValue();
    this.adminApi.saveSubjectDetails(id, v).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('TOAST_SAVED');
      },
      error: err => {
        this.saving.set(false);
        this.toast.error(errorMessage(err, 'ERR_GENERIC'));
      },
    });
  }

  protected uploadPlan(input: HTMLInputElement): void {
    const id = this.selectedSubjectId();
    const file = input.files?.[0];
    if (!id || !file) return;
    this.adminApi.uploadPlan(id, file).subscribe({
      next: () => {
        input.value = '';
        this.hasPlan.set(true);
        this.toast.success('TOAST_SAVED');
      },
      error: err => this.toast.error(errorMessage(err, 'ERR_GENERIC')),
    });
  }

  protected deletePlan(): void {
    const id = this.selectedSubjectId();
    if (!id) return;
    this.adminApi.deletePlan(id).subscribe(() => this.hasPlan.set(false));
  }

  private authorGroup(fullName: string, position: string): AuthorGroup {
    return this.fb.group({ fullName: [fullName, Validators.required], position: [position] });
  }
}
