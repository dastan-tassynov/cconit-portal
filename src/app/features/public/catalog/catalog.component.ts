import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CourseApiService } from '../../../core/api/course-api.service';
import { PublicCourse } from '../../../core/api/models';
import { CourseGroup, OTHER_GROUP, groupCourses } from '../../../core/utils/course-groups';
import { LanguageService } from '../../../core/i18n/language.service';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { SiteHeaderComponent } from '../../../shared/site-header/site-header.component';

const GRADIENTS = ['#e0e7ff', '#dbeafe', '#fef9c3', '#dcfce7', '#fce7f3', '#ede9fe'];

/** Каталог «Повышение квалификации»: группы-предметы из Өрлеу слева, курсы справа. */
@Component({
  selector: 'app-catalog',
  imports: [RouterLink, DecimalPipe, TranslatePipe, SiteHeaderComponent, FooterComponent],
  templateUrl: './catalog.component.html',
  styleUrls: ['../page.css', './catalog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogComponent {
  private readonly courseApi = inject(CourseApiService);
  private readonly language = inject(LanguageService);
  private readonly router = inject(Router);

  /** ?group=<ключ> — открыть сразу нужную группу (предмет). */
  readonly group = input<string>();

  protected readonly loading = signal(true);
  private readonly courses = signal<PublicCourse[]>([]);
  private readonly selected = signal<string | null>(null);

  protected readonly tabs = computed<CourseGroup[]>(() => groupCourses(this.courses()));
  protected readonly activeKey = computed(() => {
    const key = this.selected();
    return this.tabs().some(t => t.key === key) ? key : this.tabs()[0]?.key ?? null;
  });
  protected readonly visibleCourses = computed(() => this.tabs().find(t => t.key === this.activeKey())?.courses ?? []);

  constructor() {
    effect(() => {
      this.language.current();
      this.load();
    });
    effect(() => {
      const fromUrl = this.group();
      if (fromUrl) this.selected.set(fromUrl);
    });
  }

  protected select(key: string): void {
    this.selected.set(key);
    this.router.navigate([], { queryParams: { group: key }, replaceUrl: true });
  }

  protected background(index: number): string {
    return GRADIENTS[index % GRADIENTS.length];
  }

  protected isOther(key: string): boolean {
    return key === OTHER_GROUP;
  }

  private load(): void {
    this.loading.set(true);
    this.courseApi.getPublicCatalog().subscribe({
      next: courses => {
        this.courses.set(courses);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
