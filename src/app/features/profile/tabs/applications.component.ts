import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { AccountApiService } from '../../../core/api/account-api.service';
import { ContentApiService } from '../../../core/api/content-api.service';
import { Application, ApplicationType } from '../../../core/api/models';
import { errorMessage } from '../../../core/http/error-message';
import { ToastService } from '../../../core/ui/toast.service';

/**
 * «Рабочие группы» и «Стать лектором» — одна страница, тип задаётся в данных маршрута.
 * Приём заявок админ может приостановить (тогда показываем сообщение, как у образца).
 */
@Component({
  selector: 'app-applications',
  imports: [ReactiveFormsModule, DatePipe, TranslatePipe],
  templateUrl: './applications.component.html',
  styleUrls: ['../cabinet.css', './applications.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationsComponent implements OnInit {
  private readonly accountApi = inject(AccountApiService);
  private readonly contentApi = inject(ContentApiService);
  private readonly toast = inject(ToastService);

  /** Из data маршрута (withComponentInputBinding). */
  readonly type = input.required<ApplicationType>();

  protected readonly open = signal<boolean | null>(null);
  protected readonly applications = signal<Application[]>([]);
  protected readonly mine = computed(() => this.applications().filter(a => a.type === this.type()));
  protected readonly hasPending = computed(() => this.mine().some(a => a.status === 'NEW'));
  protected readonly sending = signal(false);
  protected readonly formVisible = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    topic: ['', [Validators.required, Validators.maxLength(300)]],
    message: ['', Validators.maxLength(2000)],
  });

  protected readonly lecturerBenefits = [
    { icon: '💡', title: 'LECT_BENEFIT_1_TITLE', text: 'LECT_BENEFIT_1_TEXT' },
    { icon: '🎤', title: 'LECT_BENEFIT_2_TITLE', text: 'LECT_BENEFIT_2_TEXT' },
    { icon: '📄', title: 'LECT_BENEFIT_3_TITLE', text: 'LECT_BENEFIT_3_TEXT' },
    { icon: '✅', title: 'LECT_BENEFIT_4_TITLE', text: 'LECT_BENEFIT_4_TEXT' },
  ];

  ngOnInit(): void {
    forkJoin({ settings: this.contentApi.settings(), apps: this.accountApi.applications() }).subscribe({
      next: ({ settings, apps }) => {
        this.open.set(this.type() === 'WORKGROUP' ? settings.workgroupsOpen : settings.lecturerOpen);
        this.applications.set(apps);
      },
      error: () => this.open.set(false),
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.sending.set(true);
    this.accountApi.submitApplication(this.type(), value.topic.trim(), value.message.trim() || undefined).subscribe({
      next: app => {
        this.applications.update(list => [app, ...list]);
        this.form.reset();
        this.formVisible.set(false);
        this.sending.set(false);
        this.toast.success('APP_SENT');
      },
      error: err => {
        this.sending.set(false);
        this.toast.error(errorMessage(err, 'ERR_GENERIC'));
      },
    });
  }

  protected prefix(): string {
    return this.type() === 'WORKGROUP' ? 'WG' : 'LECT';
  }
}
