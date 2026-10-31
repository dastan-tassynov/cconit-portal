import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AccountApiService } from '../../../core/api/account-api.service';
import { CalendarEvent, DashboardSummary } from '../../../core/api/models';
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

  /** Первый день показанного месяца календаря. */
  protected readonly month = signal<Date | null>(null);
  /** Выбранный день (yyyy-MM-dd). */
  protected readonly selected = signal<string | null>(null);

  private readonly activeSet = computed(() => new Set(this.summary()?.activeDays ?? []));
  private readonly eventsByDay = computed(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of this.summary()?.events ?? []) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  });

  /** Сетка месяца: недели с понедельника, пустые клетки — null. */
  protected readonly calendar = computed(() => {
    const first = this.month();
    if (!first) return [] as ({ date: string; day: number } | null)[];
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells: ({ date: string; day: number } | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= days; d++) {
      cells.push({ date: isoDate(new Date(first.getFullYear(), first.getMonth(), d)), day: d });
    }
    while (cells.length % 7) cells.push(null);
    return cells;
  });

  protected readonly activeInMonth = computed(() =>
    this.calendar().filter(c => c && this.activeSet().has(c.date)).length);

  protected readonly selectedEvents = computed(() => {
    const day = this.selected();
    return day ? this.eventsByDay().get(day) ?? [] : [];
  });

  /** Дни недели Пн–Вс, начиная с известного понедельника. */
  protected readonly weekdays = Array.from({ length: 7 }, (_, i) => isoDate(new Date(2024, 0, 1 + i)));

  constructor() {
    effect(() => {
      this.language.current();
      this.accountApi.summary().subscribe({
        next: s => {
          this.summary.set(s);
          if (!this.month()) {
            const today = parseIso(s.today);
            this.month.set(new Date(today.getFullYear(), today.getMonth(), 1));
            this.selected.set(s.today);
          }
        },
        error: () => undefined,
      });
    });
  }

  protected shiftMonth(delta: number): void {
    const m = this.month();
    if (m) this.month.set(new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  /** Вперёд дальше текущего месяца не листаем. */
  protected canGoNext(): boolean {
    const m = this.month();
    const today = this.summary()?.today;
    if (!m || !today) return false;
    const t = parseIso(today);
    return m.getFullYear() < t.getFullYear() || (m.getFullYear() === t.getFullYear() && m.getMonth() < t.getMonth());
  }

  protected select(date: string): void {
    this.selected.set(date);
  }

  protected isActive(date: string): boolean {
    return this.activeSet().has(date);
  }

  protected hasEvents(date: string): boolean {
    return this.eventsByDay().has(date);
  }

  protected isFuture(date: string): boolean {
    const today = this.summary()?.today;
    return !!today && date > today;
  }

  protected eventIcon(e: CalendarEvent): string {
    return e.type === 'CERTIFICATE' ? '🏅' : e.type === 'TEST' ? '📝' : '📚';
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

function isoDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function parseIso(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}
