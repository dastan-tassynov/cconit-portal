import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SurveyStatusService } from '../../../core/account/survey-status.service';
import { AccountApiService } from '../../../core/api/account-api.service';
import { Survey, SurveyQuestion } from '../../../core/api/models';
import { errorMessage } from '../../../core/http/error-message';
import { ToastService } from '../../../core/ui/toast.service';
import { safeReturnUrl } from '../../../core/utils/return-url';

const OTHER = '__other';

/**
 * Анкета студента — те же вопросы, что задавал Telegram-бот перед началом обучения.
 * Обязательна перед первым курсом; ответы можно поправить позже.
 */
@Component({
  selector: 'app-survey',
  imports: [TranslatePipe],
  styleUrl: '../cabinet.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page__head">
        <h1 class="page__title">{{ 'SURVEY_TITLE' | translate }}</h1>
        @if (survey()?.completed) { <span class="pill pill--ok">{{ 'SURVEY_DONE' | translate }}</span> }
      </div>

      @if (!survey()) {
        <div class="card empty">{{ 'LOADING' | translate }}</div>
      } @else {
        <div class="card intro">
          <p>{{ (survey()!.completed ? 'SURVEY_EDIT_HINT' : 'SURVEY_INTRO') | translate }}</p>
          <div class="progress"><span [style.width.%]="progress()"></span></div>
          <small class="muted">{{ 'SURVEY_PROGRESS' | translate: { done: answeredCount(), total: survey()!.questions.length } }}</small>
        </div>

        @for (q of survey()!.questions; track q.key; let i = $index) {
          <div class="card question" [class.question--missing]="showErrors() && !isAnswered(q)" [id]="'q-' + q.key">
            <p class="question__text"><span class="question__num">{{ i + 1 }}</span> {{ q.text }}</p>
            @if (q.choice) {
              <div class="options">
                @for (o of q.options; track o.key) {
                  <label class="option" [class.option--active]="selected()[q.key] === o.key">
                    <input type="radio" [name]="q.key" [checked]="selected()[q.key] === o.key" (change)="select(q, o.key)">
                    {{ o.label }}
                  </label>
                }
                @if (q.allowOther) {
                  <label class="option" [class.option--active]="selected()[q.key] === OTHER">
                    <input type="radio" [name]="q.key" [checked]="selected()[q.key] === OTHER" (change)="select(q, OTHER)">
                    {{ 'SURVEY_OTHER' | translate }}
                  </label>
                }
              </div>
              @if (selected()[q.key] === OTHER) {
                <input class="input" maxlength="1000" [value]="other()[q.key] ?? ''" (input)="setOther(q, $any($event.target).value)"
                       [placeholder]="'SURVEY_OTHER_PH' | translate">
              }
            } @else {
              <input class="input" maxlength="1000" [value]="selected()[q.key] ?? ''" (input)="select(q, $any($event.target).value)">
            }
          </div>
        }

        <div class="card submit">
          <label class="agree">
            <input type="checkbox" [checked]="agreed()" (change)="agreed.set($any($event.target).checked)">
            <span>{{ 'SURVEY_AGREE_1' | translate }}
              <a [href]="survey()!.agreementUrl" target="_blank" rel="noopener noreferrer">{{ 'SURVEY_AGREE_LINK' | translate }}</a></span>
          </label>
          @if (showErrors() && !canSubmit()) {
            <p class="error">{{ (agreed() ? 'SURVEY_FILL_ALL' : 'SURVEY_NEED_AGREE') | translate }}</p>
          }
          <button type="button" class="btn btn--primary" [disabled]="saving()" (click)="submit()">
            {{ (survey()!.completed ? 'BTN_SAVE' : 'SURVEY_SUBMIT') | translate }}
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .intro p { margin: 0 0 12px; line-height: 1.5; }
    .intro small { display: block; margin-top: 8px; }
    .question { display: flex; flex-direction: column; gap: 12px; }
    .question--missing { border-color: #f59e0b; box-shadow: 0 0 0 3px #fef3c7; }
    .question__text { margin: 0; font-weight: 600; line-height: 1.4; }
    .question__num { display: inline-flex; width: 26px; height: 26px; border-radius: 50%; background: #eef0ff; color: var(--primary);
                     align-items: center; justify-content: center; font-size: 13px; margin-right: 6px; }
    .options { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px; }
    .option { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; cursor: pointer; line-height: 1.35; }
    .option--active { border-color: var(--primary); background: #f4f4fe; }
    .option input { margin-top: 3px; }
    .input { padding: 11px 12px; border: 1px solid var(--line); border-radius: 10px; background: #f6f6f9; font: inherit; }
    .submit { display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
    .agree { display: flex; gap: 10px; align-items: flex-start; line-height: 1.4; }
    .agree a { color: var(--primary); }
    .error { color: #b45309; margin: 0; }
  `,
})
export class SurveyComponent implements OnInit {
  private readonly accountApi = inject(AccountApiService);
  private readonly surveyStatus = inject(SurveyStatusService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** ?returnUrl= — куда вернуться после анкеты (страница курса). */
  readonly returnUrl = input<string>();

  protected readonly OTHER = OTHER;
  protected readonly survey = signal<Survey | null>(null);
  protected readonly selected = signal<Partial<Record<string, string>>>({});
  protected readonly other = signal<Partial<Record<string, string>>>({});
  protected readonly agreed = signal(false);
  protected readonly saving = signal(false);
  protected readonly showErrors = signal(false);

  protected readonly answeredCount = computed(
    () => this.survey()?.questions.filter(q => this.isAnswered(q)).length ?? 0,
  );
  protected readonly progress = computed(() => {
    const total = this.survey()?.questions.length ?? 0;
    return total ? Math.round((this.answeredCount() * 100) / total) : 0;
  });
  protected readonly canSubmit = computed(
    () => this.agreed() && this.answeredCount() === (this.survey()?.questions.length ?? -1),
  );

  ngOnInit(): void {
    this.accountApi.survey().subscribe({
      next: survey => this.apply(survey),
      error: err => this.toast.error(errorMessage(err, 'ERR_GENERIC')),
    });
  }

  protected isAnswered(q: SurveyQuestion): boolean {
    const value = this.selected()[q.key];
    if (value === OTHER) {
      return !!this.other()[q.key]?.trim();
    }
    return !!value?.trim();
  }

  protected select(q: SurveyQuestion, value: string): void {
    this.selected.update(map => ({ ...map, [q.key]: value }));
  }

  protected setOther(q: SurveyQuestion, value: string): void {
    this.other.update(map => ({ ...map, [q.key]: value }));
  }

  protected submit(): void {
    const survey = this.survey();
    if (!survey) return;
    if (!this.canSubmit()) {
      this.showErrors.set(true);
      const firstMissing = survey.questions.find(q => !this.isAnswered(q));
      if (firstMissing) {
        document.getElementById('q-' + firstMissing.key)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    const answers: Record<string, string> = {};
    for (const q of survey.questions) {
      const value = this.selected()[q.key];
      answers[q.key] = ((value === OTHER ? this.other()[q.key] : value) ?? '').trim();
    }
    this.saving.set(true);
    this.accountApi.submitSurvey(answers).subscribe({
      next: updated => {
        this.saving.set(false);
        this.surveyStatus.markCompleted();
        this.apply(updated);
        this.toast.success('SURVEY_SAVED');
        const back = this.returnUrl();
        if (back) {
          this.router.navigateByUrl(safeReturnUrl(back));
        }
      },
      error: err => {
        this.saving.set(false);
        this.toast.error(errorMessage(err, 'ERR_GENERIC'));
      },
    });
  }

  private apply(survey: Survey): void {
    const selected: Record<string, string> = {};
    const other: Record<string, string> = {};
    for (const q of survey.questions) {
      const answer = survey.answers[q.key];
      if (answer === undefined) continue;
      if (q.choice && !q.options.some(o => o.key === answer)) {
        if (q.allowOther) {
          selected[q.key] = OTHER;
          other[q.key] = answer;
        }
      } else {
        selected[q.key] = answer;
      }
    }
    this.survey.set(survey);
    this.selected.set(selected);
    this.other.set(other);
    this.agreed.set(survey.completed);
  }
}
