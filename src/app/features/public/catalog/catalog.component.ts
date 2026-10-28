import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { ContentApiService } from '../../../core/api/content-api.service';
import { CourseApiService } from '../../../core/api/course-api.service';
import { Direction, PublicCourse } from '../../../core/api/models';
import { LanguageService } from '../../../core/i18n/language.service';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { SiteHeaderComponent } from '../../../shared/site-header/site-header.component';

const OTHER = -1;
const GRADIENTS = ['#e0e7ff', '#dbeafe', '#fef9c3', '#dcfce7', '#fce7f3', '#ede9fe'];

/** Каталог «Повышение квалификации»: направления слева, курсы справа (как у образца). */
@Component({
  selector: 'app-catalog',
  imports: [RouterLink, DecimalPipe, TranslatePipe, SiteHeaderComponent, FooterComponent],
  templateUrl: './catalog.component.html',
  styleUrls: ['../page.css', './catalog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogComponent {
  private readonly contentApi = inject(ContentApiService);
  private readonly courseApi = inject(CourseApiService);
  private readonly language = inject(LanguageService);
  private readonly router = inject(Router);

  /** ?direction=<id> — открыть сразу нужное направление. */
  readonly direction = input<string>();

  protected readonly loading = signal(true);
  private readonly directions = signal<Direction[]>([]);
  private readonly courses = signal<PublicCourse[]>([]);
  private readonly selected = signal<number | null>(null);

  /** Направления + «Другие курсы» для курсов без направления. */
  protected readonly tabs = computed(() => {
    const list = this.directions().map(d => ({ id: d.id, title: d.title, icon: d.icon || '🎓' }));
    if (this.courses().some(c => !c.directionId)) {
      list.push({ id: OTHER, title: '', icon: '📚' });
    }
    return list;
  });
  protected readonly activeId = computed(() => this.selected() ?? this.tabs()[0]?.id ?? null);
  protected readonly visibleCourses = computed(() => {
    const id = this.activeId();
    return this.courses().filter(c => (id === OTHER ? !c.directionId : c.directionId === id));
  });

  constructor() {
    effect(() => {
      this.language.current();
      this.load();
    });
    effect(() => {
      const fromUrl = Number(this.direction());
      if (fromUrl) this.selected.set(fromUrl);
    });
  }

  protected select(id: number): void {
    this.selected.set(id);
    this.router.navigate([], { queryParams: { direction: id === OTHER ? null : id }, replaceUrl: true });
  }

  protected background(index: number): string {
    return GRADIENTS[index % GRADIENTS.length];
  }

  protected isOther(id: number): boolean {
    return id === OTHER;
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({ directions: this.contentApi.directions(), courses: this.courseApi.getPublicCatalog() }).subscribe({
      next: ({ directions, courses }) => {
        this.directions.set(directions);
        this.courses.set(courses);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
