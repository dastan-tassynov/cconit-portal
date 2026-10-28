import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ContentApiService } from '../../../core/api/content-api.service';
import { CourseApiService } from '../../../core/api/course-api.service';
import { Direction as CatalogDirection, NewsItem, PublicCourse, PublicStats } from '../../../core/api/models';
import { errorMessage } from '../../../core/http/error-message';
import { LanguageService } from '../../../core/i18n/language.service';
import { ToastService } from '../../../core/ui/toast.service';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { SiteHeaderComponent } from '../../../shared/site-header/site-header.component';
import { PROGRAMS } from '../program/programs';

interface Direction {
  code: string;
  title: string;
  icon: string;
  courses: PublicCourse[];
}

const NEWS_PREVIEW = 3;
const CARD_GRADIENTS = [
  'linear-gradient(135deg,#e0e7ff,#c7d2fe)',
  'linear-gradient(135deg,#dbeafe,#bfdbfe)',
  'linear-gradient(135deg,#fef9c3,#fde68a)',
  'linear-gradient(135deg,#dcfce7,#bbf7d0)',
  'linear-gradient(135deg,#fce7f3,#fbcfe8)',
];
const CARD_ICONS = ['📘', '🧠', '🧩', '🌍', '⚖️', '🧬', '🛡️', '🎨'];

/**
 * Главная страница. Структура повторяет kcppk-bilimzet.kz:
 * герой → о сервисе → новости → баннер → о центре → направления с курсами → форма обратной связи → футер.
 * Тексты, логотип и данные — ЦОНИТ.
 */
@Component({
  selector: 'app-home',
  imports: [RouterLink, FormsModule, ReactiveFormsModule, DatePipe, DecimalPipe, TranslatePipe, SiteHeaderComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly courseApi = inject(CourseApiService);
  private readonly contentApi = inject(ContentApiService);
  private readonly language = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  // ---------- статистика
  protected readonly stats = signal<PublicStats | null>(null);

  // ---------- новости (из админки); пока их нет — проекты образовательных программ
  protected readonly news = signal<NewsItem[]>([]);
  protected readonly programDrafts = PROGRAMS.slice(0, NEWS_PREVIEW);

  // ---------- направления и курсы
  protected readonly coursesLoading = signal(true);
  private readonly courses = signal<PublicCourse[]>([]);
  private readonly catalogDirections = signal<CatalogDirection[]>([]);
  /**
   * Вкладки: направления из админки. Если направления ещё не заведены —
   * группируем по коду программы, чтобы главная не была пустой.
   */
  protected readonly directions = computed<Direction[]>(() => {
    const courses = this.courses();
    const dirs = this.catalogDirections();
    if (dirs.length) {
      const result: Direction[] = dirs.map(d => ({
        code: String(d.id), title: d.title, icon: d.icon || '🎓',
        courses: courses.filter(c => c.directionId === d.id),
      }));
      const other = courses.filter(c => !c.directionId);
      if (other.length) result.push({ code: 'OTHER', title: '', icon: '📚', courses: other });
      return result.filter(d => d.courses.length);
    }
    const groups = new Map<string, PublicCourse[]>();
    for (const course of courses) {
      const code = course.programCode || 'OTHER';
      groups.set(code, [...(groups.get(code) ?? []), course]);
    }
    return [...groups.entries()].map(([code, list]) => ({ code, title: code, icon: '🎓', courses: list }));
  });
  protected readonly activeDirection = signal<string | null>(null);
  protected readonly visibleCourses = computed(() => {
    const dirs = this.directions();
    const active = dirs.find(d => d.code === this.activeDirection()) ?? dirs[0];
    return active?.courses ?? [];
  });
  protected readonly activeCode = computed(() => this.activeDirection() ?? this.directions()[0]?.code ?? null);

  // ---------- проверка сертификата
  protected certificateCode = '';

  // ---------- форма обратной связи
  protected readonly contactForm = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    phone: ['', Validators.pattern(/^$|^\+?[\d\s()-]{10,20}$/)],
    email: ['', Validators.email],
    message: ['', Validators.maxLength(2000)],
    website: [''],
  });
  protected readonly contactSending = signal(false);
  protected readonly contactSent = signal(false);

  constructor() {
    effect(() => {
      this.language.current();
      this.loadCourses();
    });
    this.courseApi.getPublicStats().subscribe({ next: s => this.stats.set(s), error: () => undefined });
  }

  protected cardBackground(index: number): string {
    return CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  }

  protected cardIcon(index: number): string {
    return CARD_ICONS[index % CARD_ICONS.length];
  }

  /** Карточка курса ведёт на его страницу: там описание, план и покупка. */
  protected openDirection(code: string): void {
    this.activeDirection.set(code);
  }

  protected enroll(course: PublicCourse): void {
    this.router.navigate(['/courses', course.id]);
  }

  protected verifyCertificate(): void {
    const code = this.certificateCode.trim();
    if (code) {
      this.router.navigate(['/verify/certificate', code]);
    }
  }

  protected sendContact(): void {
    const value = this.contactForm.getRawValue();
    if (this.contactForm.invalid || (!value.phone.trim() && !value.email.trim())) {
      this.contactForm.markAllAsTouched();
      this.toast.error('CONTACT_VALIDATION');
      return;
    }
    this.contactSending.set(true);
    this.courseApi.sendContactRequest(value).subscribe({
      next: () => {
        this.contactSending.set(false);
        this.contactSent.set(true);
        this.contactForm.reset();
      },
      error: err => {
        this.contactSending.set(false);
        this.toast.error(errorMessage(err, 'ERR_GENERIC'));
      },
    });
  }

  private loadCourses(): void {
    this.coursesLoading.set(true);
    this.courseApi.getPublicCatalog().subscribe({
      next: courses => {
        this.courses.set(courses);
        this.coursesLoading.set(false);
      },
      error: () => this.coursesLoading.set(false),
    });
    this.contentApi.directions().subscribe({ next: d => this.catalogDirections.set(d), error: () => undefined });
    this.contentApi.news(0, NEWS_PREVIEW).subscribe({ next: p => this.news.set(p.items), error: () => undefined });
  }
}
