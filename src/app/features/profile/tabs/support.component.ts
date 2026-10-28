import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminApiService } from '../../../core/api/admin-api.service';
import { ConstructorSubject, NameChange, OrleuOverview, QuizLocked, StudentAdmin } from '../../../core/api/models';
import { errorMessage } from '../../../core/http/error-message';
import { ToastService } from '../../../core/ui/toast.service';
import { saveBlob } from '../../../core/utils/download';

/**
 * Поддержка студентов — то, что администратор делал в Telegram-боте:
 * найти человека, поправить ФИО/ИИН, выдать или забрать курс, подтвердить смену ФИО,
 * сделать рассылку и выгрузить анкеты.
 */
@Component({
  selector: 'app-support',
  imports: [ReactiveFormsModule, DatePipe, TranslatePipe],
  styleUrl: '../profile.shared.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3 class="section-title">{{ currentTitle() | translate }}</h3>

    @switch (tab()) {
      @case ('students') {
        <form class="plan" (ngSubmit)="search()">
          <input class="search" [value]="query()" (input)="query.set($any($event.target).value)" name="q"
                 [placeholder]="'SUPPORT_SEARCH_PH' | translate">
          <button type="submit" class="btn-primary">{{ 'SUPPORT_SEARCH' | translate }}</button>
        </form>

        <table class="data-table">
          <thead><tr><th>{{ 'TH_FULLNAME' | translate }}</th><th>{{ 'CAB_IIN' | translate }}</th><th>{{ 'TH_CONTACTS' | translate }}</th><th class="text-right"></th></tr></thead>
          <tbody>
            @for (s of results(); track s.id) {
              <tr [class.selected-row]="selected()?.id === s.id">
                <td>{{ s.fullName || '—' }}</td><td>{{ s.iin }}</td><td>{{ s.email }}@if (s.phoneNumber) {<br>{{ s.phoneNumber }}}</td>
                <td class="text-right"><button type="button" class="btn-small btn-small--amber" (click)="open(s)">{{ 'BTN_EDIT' | translate }}</button></td>
              </tr>
            } @empty {
              <tr><td colspan="4" class="muted">{{ (searched() ? 'SUPPORT_NOT_FOUND' : 'SUPPORT_SEARCH_HINT') | translate }}</td></tr>
            }
          </tbody>
        </table>

        @if (selected(); as s) {
          <form class="constructor-section" [formGroup]="form" (ngSubmit)="saveStudent()">
            <div class="constructor-section-header">
              <h4>{{ s.email }}</h4>
              <span class="pill" [class.pill--ok]="s.surveyCompleted" [class.pill--no]="!s.surveyCompleted">
                {{ (s.surveyCompleted ? 'SUPPORT_SURVEY_DONE' : 'SUPPORT_SURVEY_MISSING') | translate }}
              </span>
            </div>
            <div class="form-row">
              <div class="form-group"><label>{{ 'CAB_LAST_NAME' | translate }}</label><input formControlName="lastName"></div>
              <div class="form-group"><label>{{ 'CAB_FIRST_NAME' | translate }}</label><input formControlName="firstName"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>{{ 'CAB_MIDDLE_NAME' | translate }}</label><input formControlName="middleName"></div>
              <div class="form-group"><label>{{ 'CAB_IIN' | translate }}</label><input formControlName="iin" maxlength="12"></div>
            </div>
            <div class="form-group"><label>{{ 'CONTACT_PHONE' | translate }}</label><input formControlName="phoneNumber"></div>
            <button type="submit" class="btn-primary">{{ 'BTN_SAVE' | translate }}</button>

            <h4>{{ 'SUPPORT_COURSES' | translate }}</h4>
            <table class="data-table">
              <tbody>
                @for (c of s.courses; track c.subjectId) {
                  <tr>
                    <td>{{ c.title }} @if (c.completed) { <span class="pill pill--ok">{{ 'CAB_STAT_COMPLETED' | translate }}</span> }
                      @if (c.quizLocked) { <span class="pill pill--no">🔒 {{ 'SUPPORT_QUIZ_LOCKED' | translate }}</span> }</td>
                    <td class="muted">{{ 'SUPPORT_ATTEMPTS' | translate: { used: c.attemptsUsed, left: c.attemptsLeft } }}</td>
                    <td class="text-right">
                      @if (c.quizLocked) {
                        <button type="button" class="btn-small btn-small--green" (click)="unlock(s.id, c.subjectId)">{{ 'SUPPORT_UNLOCK' | translate }}</button>
                      }
                      @if (!c.completed) {
                        <button type="button" class="btn-small btn-small--red" (click)="revoke(s, c.subjectId, c.title)">{{ 'SUPPORT_REVOKE' | translate }}</button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr><td class="muted">{{ 'SUPPORT_NO_COURSES' | translate }}</td></tr>
                }
              </tbody>
            </table>
            <div class="plan">
              <select [value]="grantId()" (change)="grantId.set($any($event.target).value)">
                <option value="">{{ 'SUPPORT_PICK_COURSE' | translate }}</option>
                @for (subject of grantable(); track subject.id) {
                  <option [value]="subject.id">{{ subject.title }}</option>
                }
              </select>
              <button type="button" class="btn-small btn-small--green" [disabled]="!grantId()" (click)="grant(s)">{{ 'SUPPORT_GRANT' | translate }}</button>
            </div>
          </form>
        }
      }

      @case ('locked') {
        <p class="muted">{{ 'SUPPORT_LOCKED_HINT' | translate }}</p>
        <table class="data-table">
          <thead><tr><th>{{ 'TH_FULLNAME' | translate }}</th><th>{{ 'TH_COURSE' | translate }}</th><th>{{ 'TH_CONTACTS' | translate }}</th><th>{{ 'TH_RESULT' | translate }}</th><th class="text-right"></th></tr></thead>
          <tbody>
            @for (l of quizLocked(); track l.userId + '-' + l.subjectId) {
              <tr>
                <td>{{ l.fullName }}</td>
                <td>{{ l.subjectTitle }}</td>
                <td>{{ l.email }}@if (l.phone) {<br>{{ l.phone }}}</td>
                <td>{{ l.lastScore ?? '—' }}% · {{ 'SUPPORT_ATTEMPTS_USED' | translate: { used: l.attemptsUsed } }}
                  @if (l.lastAttemptDate) {<br><span class="muted">{{ l.lastAttemptDate | date: 'dd.MM.yyyy HH:mm' }}</span>}</td>
                <td class="text-right"><button type="button" class="btn-small btn-small--green" (click)="unlock(l.userId, l.subjectId)">{{ 'SUPPORT_UNLOCK' | translate }}</button></td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="muted">{{ 'SUPPORT_LOCKED_EMPTY' | translate }}</td></tr>
            }
          </tbody>
        </table>
      }

      @case ('names') {
        <p class="muted">{{ 'SUPPORT_NAMES_HINT' | translate }}</p>
        @for (r of nameChanges(); track r.id) {
          <div class="constructor-section">
            <div class="app-head">
              <div>
                <b>{{ r.oldFullName || '—' }}</b> → <b>{{ r.newFullName }}</b>
                <div class="muted">{{ r.email }} · {{ 'CAB_IIN' | translate }} {{ r.iin }} · {{ r.createdAt | date: 'dd.MM.yyyy HH:mm' }}</div>
              </div>
            </div>
            <div class="decision">
              <input #comment [placeholder]="'ADMIN_COMMENT_PH' | translate">
              <button type="button" class="btn-small btn-small--green" (click)="decide(r, true, comment.value)">{{ 'ADMIN_APPROVE' | translate }}</button>
              <button type="button" class="btn-small btn-small--red" (click)="decide(r, false, comment.value)">{{ 'ADMIN_REJECT' | translate }}</button>
            </div>
          </div>
        } @empty {
          <p class="muted">{{ 'SUPPORT_NAMES_EMPTY' | translate }}</p>
        }
      }

      @case ('announce') {
        <div class="constructor-section">
          <p class="muted">{{ 'SUPPORT_ANNOUNCE_HINT' | translate }}</p>
          <textarea class="form-textarea" maxlength="500" [value]="announcement()" (input)="announcement.set($any($event.target).value)"></textarea>
          <small class="muted">{{ announcement().length }}/500</small>
          <div class="plan">
            <button type="button" class="btn-primary" [disabled]="!announcement().trim() || sending()" (click)="announce()">{{ 'SUPPORT_ANNOUNCE_SEND' | translate }}</button>
          </div>
        </div>
      }

      @case ('orleu') {
        @if (orleu(); as o) {
          <div class="constructor-section">
            <div class="app-head">
              <div>
                <b>{{ 'ORLEU_TITLE' | translate }}</b>
                <div class="muted">{{ o.baseUrl }} · {{ 'ORLEU_BIN' | translate }} {{ o.bin }} · courseQualTypeId = {{ o.courseQualTypeId }}</div>
              </div>
              <span class="pill" [class.pill--ok]="o.enabled" [class.pill--no]="!o.enabled">{{ (o.enabled ? 'ORLEU_ON' : 'ORLEU_OFF') | translate }}</span>
            </div>
            <div class="plan">
              <span class="pill pill--ok">{{ 'ORLEU_SENT' | translate }}: {{ o.sentCount }}</span>
              <span class="pill pill--info">{{ 'ORLEU_PENDING' | translate }}: {{ o.pendingCount + o.retryCount }}</span>
              <span class="pill pill--no">{{ 'ORLEU_FAILED' | translate }}: {{ o.failedCount }}</span>
              <button type="button" class="btn-small btn-small--muted" (click)="pingOrleu()">🔌 {{ 'ORLEU_PING' | translate }}</button>
              <button type="button" class="btn-small btn-small--muted" (click)="loadOrleu()">↻</button>
            </div>
            @if (pingResult()) { <p class="muted">{{ pingResult() }}</p> }
            <p class="muted">{{ 'ORLEU_HINT' | translate }}</p>
          </div>

          <table class="data-table">
            <thead><tr><th>№</th><th>{{ 'TH_FULLNAME' | translate }}</th><th>{{ 'TH_COURSE' | translate }}</th><th>{{ 'TH_STATUS' | translate }}</th><th class="text-right"></th></tr></thead>
            <tbody>
              @for (c of o.problems; track c.id) {
                <tr>
                  <td>{{ c.certificateNumber }}<br><span class="muted">{{ c.issuedAt | date: 'dd.MM.yyyy' }}</span></td>
                  <td>{{ c.fullName }}<br><span class="muted">{{ 'CAB_IIN' | translate }} {{ c.iin }}</span></td>
                  <td>{{ c.subjectTitle }}<br><span class="muted">{{ c.programCode || '—' }}</span></td>
                  <td>
                    <span class="pill" [class.pill--no]="c.status === 'FAILED'" [class.pill--info]="c.status !== 'FAILED'">{{ 'ORLEU_STATUS_' + c.status | translate }}</span>
                    @if (c.error) { <div class="muted small-text">{{ c.error }}</div> }
                  </td>
                  <td class="text-right">
                    <button type="button" class="btn-small btn-small--green" [disabled]="!o.enabled" (click)="resendOrleu(c.id)">{{ 'ORLEU_RESEND' | translate }}</button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="muted">✅ {{ 'ORLEU_ALL_SENT' | translate }}</td></tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="muted">{{ 'LOADING' | translate }}</p>
        }
      }

      @case ('reports') {
        <div class="constructor-section">
          <h4>📝 {{ 'SURVEY_TITLE' | translate }}</h4>
          <p class="muted">{{ 'SUPPORT_SURVEY_REPORT_HINT' | translate }}</p>
          <button type="button" class="btn-primary" (click)="downloadSurvey()">⬇ Excel</button>
        </div>
      }
    }
  `,
  styles: `
    .search { flex: 1; min-width: 240px; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; }
    .selected-row { background: #f0f9ff; }
    .small-text { font-size: 12px; margin-top: 4px; max-width: 360px; }
    select { padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; max-width: 420px; }
  `,
})
export class SupportComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  /** Раздел кабинета администратора (data маршрута): каждый — отдельная страница в меню. */
  readonly section = input<'students' | 'quiz-locked' | 'name-changes' | 'announcements' | 'orleu' | 'reports'>('students');

  private static readonly TABS = {
    students: { tab: 'students', title: 'SUPPORT_TAB_STUDENTS' },
    'quiz-locked': { tab: 'locked', title: 'SUPPORT_TAB_LOCKED' },
    'name-changes': { tab: 'names', title: 'SUPPORT_TAB_NAMES' },
    announcements: { tab: 'announce', title: 'SUPPORT_TAB_ANNOUNCE' },
    orleu: { tab: 'orleu', title: 'SUPPORT_TAB_ORLEU' },
    reports: { tab: 'reports', title: 'SUPPORT_TAB_REPORTS' },
  } as const;

  protected readonly tab = computed(() => SupportComponent.TABS[this.section()].tab);
  protected readonly currentTitle = computed(() => SupportComponent.TABS[this.section()].title);
  protected readonly query = signal('');
  protected readonly searched = signal(false);
  protected readonly results = signal<StudentAdmin[]>([]);
  protected readonly selected = signal<StudentAdmin | null>(null);
  protected readonly subjects = signal<ConstructorSubject[]>([]);
  protected readonly grantId = signal('');
  protected readonly nameChanges = signal<NameChange[]>([]);
  protected readonly quizLocked = signal<QuizLocked[]>([]);
  protected readonly orleu = signal<OrleuOverview | null>(null);
  protected readonly pingResult = signal('');
  protected readonly announcement = signal('');
  protected readonly sending = signal(false);

  protected readonly grantable = computed(() => {
    const owned = new Set(this.selected()?.courses.map(c => c.subjectId) ?? []);
    return this.subjects().filter(s => !owned.has(s.id));
  });

  protected readonly form = this.fb.group({
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    middleName: [''],
    iin: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
    phoneNumber: ['', Validators.pattern(/^$|^\+?\d{10,15}$/)],
  });

  ngOnInit(): void {
    // Каждый раздел — своя страница: грузим только то, что на ней нужно
    switch (this.tab()) {
      case 'students':
        this.adminApi.getSubjects().subscribe(subjects => this.subjects.set(subjects));
        break;
      case 'names':
        this.loadNameChanges();
        break;
      case 'locked':
        this.loadQuizLocked();
        break;
      case 'orleu':
        this.loadOrleu();
        break;
    }
  }


  protected loadOrleu(): void {
    this.adminApi.orleuOverview().subscribe(o => this.orleu.set(o));
  }

  protected pingOrleu(): void {
    this.pingResult.set('…');
    this.adminApi.orleuPing().subscribe({
      next: types => this.pingResult.set('✅ OK: ' + types.join('; ')),
      error: err => this.pingResult.set('❌ ' + errorMessage(err, 'ERR_GENERIC')),
    });
  }

  protected resendOrleu(certificateId: number): void {
    this.adminApi.orleuResend(certificateId).subscribe({
      next: c => {
        if (c.status === 'SENT') {
          this.toast.success('ORLEU_RESENT');
        } else {
          this.toast.error(c.error || 'ERR_GENERIC');
        }
        this.loadOrleu();
      },
      error: err => this.toast.error(errorMessage(err, 'ERR_GENERIC')),
    });
  }

  /** Открыть тест ещё на 3 попытки. */
  protected unlock(userId: number, subjectId: number): void {
    this.adminApi.unlockQuiz(userId, subjectId).subscribe({
      next: updated => {
        if (this.selected()?.id === updated.id) {
          this.selected.set(updated);
          this.results.update(list => list.map(s => (s.id === updated.id ? updated : s)));
        }
        this.toast.success('SUPPORT_UNLOCKED');
        this.loadQuizLocked();
      },
      error: err => this.toast.error(errorMessage(err, 'ERR_GENERIC')),
    });
  }

  protected search(): void {
    const q = this.query().trim();
    if (q.length < 3) {
      this.toast.error('SUPPORT_SEARCH_HINT');
      return;
    }
    this.adminApi.searchStudents(q).subscribe({
      next: results => {
        this.results.set(results);
        this.searched.set(true);
      },
      error: err => this.toast.error(errorMessage(err, 'ERR_GENERIC')),
    });
  }

  protected open(s: StudentAdmin): void {
    this.selected.set(s);
    this.grantId.set('');
    this.form.reset({
      lastName: s.lastName ?? '',
      firstName: s.firstName ?? '',
      middleName: s.middleName ?? '',
      iin: s.iin,
      phoneNumber: s.phoneNumber ?? '',
    });
  }

  protected saveStudent(): void {
    const s = this.selected();
    if (!s) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('VALIDATION_CHECK_FIELDS');
      return;
    }
    this.adminApi.updateStudent(s.id, this.form.getRawValue()).subscribe({
      next: updated => this.replace(updated, 'TOAST_SAVED'),
      error: err => this.toast.error(errorMessage(err, 'ERR_GENERIC')),
    });
  }

  protected grant(s: StudentAdmin): void {
    const subjectId = Number(this.grantId());
    if (!subjectId) return;
    this.adminApi.grantCourse(s.id, subjectId).subscribe({
      next: updated => this.replace(updated, 'SUPPORT_GRANTED'),
      error: err => this.toast.error(errorMessage(err, 'ERR_GENERIC')),
    });
  }

  protected revoke(s: StudentAdmin, subjectId: number, title: string): void {
    if (!confirm(title + '?')) return;
    this.adminApi.revokeCourse(s.id, subjectId).subscribe({
      next: updated => this.replace(updated, 'SUPPORT_REVOKED'),
      error: err => this.toast.error(errorMessage(err, 'ERR_GENERIC')),
    });
  }

  protected decide(r: NameChange, approved: boolean, comment: string): void {
    this.adminApi.decideNameChange(r.id, approved, comment || undefined).subscribe({
      next: () => {
        this.toast.success('TOAST_SAVED');
        this.loadNameChanges();
      },
      error: err => this.toast.error(errorMessage(err, 'ERR_GENERIC')),
    });
  }

  protected announce(): void {
    const text = this.announcement().trim();
    if (!text || !confirm(text)) return;
    this.sending.set(true);
    this.adminApi.announce(text).subscribe({
      next: res => {
        this.sending.set(false);
        this.announcement.set('');
        this.toast.success(res.message);
      },
      error: err => {
        this.sending.set(false);
        this.toast.error(errorMessage(err, 'ERR_GENERIC'));
      },
    });
  }

  protected downloadSurvey(): void {
    this.adminApi.downloadSurveyReport().subscribe({
      next: blob => saveBlob(blob, 'Survey.xlsx'),
      error: () => this.toast.error('ERR_GENERIC'),
    });
  }

  private replace(updated: StudentAdmin, toastKey: string): void {
    this.selected.set(updated);
    this.grantId.set('');
    this.results.update(list => list.map(s => (s.id === updated.id ? updated : s)));
    this.toast.success(toastKey);
  }

  private loadQuizLocked(): void {
    this.adminApi.quizLocked().subscribe(list => this.quizLocked.set(list));
  }

  private loadNameChanges(): void {
    this.adminApi.nameChanges().subscribe(list => this.nameChanges.set(list));
  }
}
