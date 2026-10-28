import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AccountApiService } from '../../../core/api/account-api.service';
import { DashboardSummary } from '../../../core/api/models';
import { SessionService } from '../../../core/auth/session.service';
import { LanguageService } from '../../../core/i18n/language.service';

/** «Главная» кабинета: приветствие, серия дней, счётчики, мои курсы, неделя активности. */
@Component({
  selector: 'app-cabinet-home',
  imports: [RouterLink, DatePipe, TranslatePipe],
  templateUrl: './cabinet-home.component.html',
  styleUrls: ['../cabinet.css', './cabinet-home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CabinetHomeComponent {
  private readonly accountApi = inject(AccountApiService);
  protected readonly language = inject(LanguageService);
  protected readonly session = inject(SessionService);

  protected readonly summary = signal<DashboardSummary | null>(null);

  constructor() {
    effect(() => {
      this.language.current();
      this.accountApi.summary().subscribe({ next: s => this.summary.set(s), error: () => undefined });
    });
  }

  /** Локаль для дат: казахский или русский. */
  protected locale(): string {
    return this.language.current() === 'kk' ? 'kk' : 'ru';
  }

  protected greetingKey(): string {
    const hour = new Date().getHours();
    if (hour < 5) return 'CAB_GREETING_NIGHT';
    if (hour < 12) return 'CAB_GREETING_MORNING';
    if (hour < 18) return 'CAB_GREETING_DAY';
    return 'CAB_GREETING_EVENING';
  }

  /** Имя из «Фамилия Имя Отчество». */
  protected firstName(): string {
    const parts = this.session.fullName().trim().split(/\s+/);
    return parts[1] ?? parts[0] ?? '';
  }

  protected isToday(date: string): boolean {
    return date === this.summary()?.today;
  }

  protected activeDaysThisWeek(): number {
    return this.summary()?.week.filter(d => d.active).length ?? 0;
  }
}
