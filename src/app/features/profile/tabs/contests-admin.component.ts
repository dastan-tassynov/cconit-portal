import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { PhonePipe } from '../../../shared/phone-input/phone.pipe';
import { AdminApiService } from '../../../core/api/admin-api.service';
import { AdminContest, ContestEntryAdmin } from '../../../core/api/models';
import { errorMessage } from '../../../core/http/error-message';
import { ToastService } from '../../../core/ui/toast.service';

type NominationGroup = FormGroup<{
  id: FormControl<number | null>;
  titleRu: FormControl<string>;
  titleKz: FormControl<string>;
}>;

/** Конкурсы: номинации, стоимость, участники (из раздела «Конкурсы» Telegram-бота). */
@Component({
  selector: 'app-contests-admin',
  imports: [ReactiveFormsModule, DatePipe, TranslatePipe, PhonePipe],
  styleUrl: '../profile.shared.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3 class="section-title">🏆 {{ 'CAB_MENU_CONTESTS_ADMIN' | translate }}</h3>

    <table class="data-table">
      <thead><tr>
        <th>{{ 'CONTENT_TITLE' | translate }}</th><th class="text-center">{{ 'CONTESTS_PRICE' | translate }}</th>
        <th class="text-center">{{ 'CONTESTS_ENTRIES' | translate }}</th><th class="text-right">{{ 'TH_ACTION' | translate }}</th>
      </tr></thead>
      <tbody>
        @for (c of contests(); track c.id) {
          <tr [class.muted]="!c.active">
            <td>{{ c.titleRu }} @if (!c.active) { <span class="pill pill--no">{{ 'CONTESTS_OFF' | translate }}</span> }</td>
            <td class="text-center">{{ c.price }} ₸</td>
            <td class="text-center">{{ c.entriesCount }}</td>
            <td class="text-right">
              <button type="button" class="btn-small btn-small--muted" (click)="showEntries(c)">👥</button>
              <button type="button" class="btn-small btn-small--amber" (click)="edit(c)">{{ 'BTN_EDIT' | translate }}</button>
              @if (c.entriesCount === 0) {
                <button type="button" class="btn-small btn-small--red" (click)="remove(c)">{{ 'BTN_DELETE' | translate }}</button>
              }
            </td>
          </tr>
        } @empty {
          <tr><td colspan="4" class="muted">{{ 'CONTESTS_EMPTY' | translate }}</td></tr>
        }
      </tbody>
    </table>

    @if (entriesOf(); as c) {
      <div class="constructor-section">
        <div class="constructor-section-header">
          <h4>👥 {{ c.titleRu }}</h4>
          <button type="button" class="btn-small btn-small--muted" (click)="entriesOf.set(null)">✖</button>
        </div>
        <table class="data-table">
          <thead><tr><th>№</th><th>{{ 'CONTESTS_NOMINATION' | translate }}</th><th>{{ 'TH_FULLNAME' | translate }}</th><th>{{ 'TH_CONTACTS' | translate }}</th><th>{{ 'TH_DATE' | translate }}</th></tr></thead>
          <tbody>
            @for (e of entries(); track e.id) {
              <tr><td>{{ e.participantNumber }}</td><td>{{ e.nominationTitle }}</td><td>{{ e.fullName }}</td>
                  <td>{{ e.email }}@if (e.phone) {<br>{{ e.phone | phone }}}</td><td>{{ e.createdAt | date: 'dd.MM.yyyy' }}</td></tr>
            } @empty {
              <tr><td colspan="5" class="muted">{{ 'CONTESTS_NO_ENTRIES' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    }

    <form class="constructor-section" [formGroup]="form" (ngSubmit)="save()">
      <div class="constructor-section-header">
        <h4>{{ (form.controls.id.value ? 'CONTESTS_EDIT' : 'CONTESTS_NEW') | translate }}</h4>
      </div>
      <div class="form-row">
        <div class="form-group"><label>{{ 'CONTENT_TITLE' | translate }} (RU)</label><input formControlName="titleRu"></div>
        <div class="form-group"><label>{{ 'CONTENT_TITLE' | translate }} (KZ)</label><input formControlName="titleKz"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>{{ 'CONTESTS_DESCRIPTION' | translate }} (RU)</label><textarea class="form-textarea large" formControlName="descriptionRu"></textarea></div>
        <div class="form-group"><label>{{ 'CONTESTS_DESCRIPTION' | translate }} (KZ)</label><textarea class="form-textarea large" formControlName="descriptionKz"></textarea></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>{{ 'CONTESTS_PRICE' | translate }}, ₸</label><input type="number" min="0" formControlName="price"></div>
        <div class="form-group"><label>{{ 'CONTESTS_EMAIL' | translate }}</label><input formControlName="materialsEmail"></div>
      </div>
      <label class="checkbox"><input type="checkbox" formControlName="active"> {{ 'CONTESTS_ACTIVE' | translate }}</label>

      <h4>{{ 'CONTESTS_NOMINATIONS' | translate }}</h4>
      <div formArrayName="nominations">
        @for (group of nominations.controls; track group; let i = $index) {
          <div class="form-row author-row" [formGroupName]="i">
            <input formControlName="titleRu" placeholder="RU">
            <input formControlName="titleKz" placeholder="KZ">
            <button type="button" class="btn-small btn-small--red" (click)="nominations.removeAt(i)">✖</button>
          </div>
        }
      </div>
      <button type="button" class="btn-small btn-small--muted" (click)="addNomination()">+ {{ 'CONTESTS_ADD_NOMINATION' | translate }}</button>

      <div class="plan">
        <button type="submit" class="btn-primary" [disabled]="saving()">{{ 'BTN_SAVE' | translate }}</button>
        @if (form.controls.id.value) {
          <button type="button" class="btn-small btn-small--muted" (click)="reset()">{{ 'BTN_CANCEL' | translate }}</button>
        }
      </div>
    </form>
  `,
})
export class ContestsAdminComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly contests = signal<AdminContest[]>([]);
  protected readonly entriesOf = signal<AdminContest | null>(null);
  protected readonly entries = signal<ContestEntryAdmin[]>([]);
  protected readonly saving = signal(false);

  protected readonly nominations = new FormArray<NominationGroup>([]);
  protected readonly form = this.fb.group({
    id: this.fb.control<number | null>(null),
    titleRu: ['', [Validators.required, Validators.maxLength(300)]],
    titleKz: ['', [Validators.required, Validators.maxLength(300)]],
    descriptionRu: [''],
    descriptionKz: [''],
    price: [10000, [Validators.required, Validators.min(0)]],
    materialsEmail: [''],
    active: [true],
    nominations: this.nominations,
  });

  ngOnInit(): void {
    this.load();
    this.addNomination();
  }

  protected addNomination(id: number | null = null, titleRu = '', titleKz = ''): void {
    this.nominations.push(
      this.fb.group({
        id: this.fb.control<number | null>(id),
        titleRu: [titleRu, Validators.required],
        titleKz: [titleKz, Validators.required],
      }),
    );
  }

  protected edit(c: AdminContest): void {
    this.nominations.clear();
    c.nominations.forEach(n => this.addNomination(n.id ?? null, n.titleRu, n.titleKz));
    this.form.patchValue({
      id: c.id,
      titleRu: c.titleRu,
      titleKz: c.titleKz,
      descriptionRu: c.descriptionRu ?? '',
      descriptionKz: c.descriptionKz ?? '',
      price: c.price,
      materialsEmail: c.materialsEmail ?? '',
      active: c.active,
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  protected reset(): void {
    this.form.reset({ id: null, titleRu: '', titleKz: '', descriptionRu: '', descriptionKz: '', price: 10000, materialsEmail: '', active: true });
    this.nominations.clear();
    this.addNomination();
  }

  protected save(): void {
    if (this.form.invalid || this.nominations.length === 0) {
      this.form.markAllAsTouched();
      this.toast.error('CONTESTS_FORM_INVALID');
      return;
    }
    const { id, ...value } = this.form.getRawValue();
    this.saving.set(true);
    this.adminApi
      .saveContest(id, {
        ...value,
        nominations: value.nominations.map(n => ({ id: n.id ?? undefined, titleRu: n.titleRu, titleKz: n.titleKz })),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('TOAST_SAVED');
          this.reset();
          this.load();
        },
        error: err => {
          this.saving.set(false);
          this.toast.error(errorMessage(err, 'ERR_GENERIC'));
        },
      });
  }

  protected remove(c: AdminContest): void {
    if (!confirm(c.titleRu + '?')) return;
    this.adminApi.deleteContest(c.id).subscribe({
      next: () => this.load(),
      error: err => this.toast.error(errorMessage(err, 'ERR_GENERIC')),
    });
  }

  protected showEntries(c: AdminContest): void {
    this.entriesOf.set(c);
    this.entries.set([]);
    this.adminApi.contestEntries(c.id).subscribe(entries => this.entries.set(entries));
  }

  private load(): void {
    this.adminApi.contests().subscribe(contests => this.contests.set(contests));
  }
}
