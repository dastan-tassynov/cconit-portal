import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ContentApiService } from '../../../core/api/content-api.service';
import { NewsItem } from '../../../core/api/models';
import { api } from '../../../core/http/api-url';
import { LanguageService } from '../../../core/i18n/language.service';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { SiteHeaderComponent } from '../../../shared/site-header/site-header.component';

const PAGE_SIZE = 9;

@Component({
  selector: 'app-news-list',
  imports: [RouterLink, DatePipe, TranslatePipe, SiteHeaderComponent, FooterComponent],
  styleUrls: ['../page.css', './news.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-site-header />
    <main class="container">
      <nav class="crumbs">
        <a routerLink="/">{{ 'CRUMB_HOME' | translate }}</a> <span>›</span>
        <span class="crumbs__current">{{ 'SITE_NEWS_TITLE' | translate }}</span>
      </nav>
      <h1 class="page-title">{{ 'SITE_NEWS_TITLE' | translate }}</h1>
      <p class="lead">{{ 'SITE_NEWS_SUBTITLE' | translate }}</p>

      <div class="news-grid">
        @for (n of items(); track n.id) {
          <a class="news-card" [routerLink]="['/news', n.id]">
            @if (n.imageUrl) { <img [src]="image(n)" alt="" class="news-card__img"> }
            <span class="news-card__title">{{ n.title }}</span>
            <span class="news-card__meta">{{ n.publishedAt | date: 'dd.MM.yyyy' }} · 👁 {{ n.views }}</span>
          </a>
        } @empty {
          <p class="muted">{{ (loading() ? 'LOADING' : 'NEWS_EMPTY') | translate }}</p>
        }
      </div>

      @if (items().length < total()) {
        <div class="more"><button type="button" class="btn btn--outline" (click)="loadMore()">{{ 'NEWS_MORE' | translate }}</button></div>
      }
    </main>
    <app-footer />
  `,
})
export class NewsListComponent {
  private readonly contentApi = inject(ContentApiService);
  private readonly language = inject(LanguageService);

  protected readonly items = signal<NewsItem[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(true);
  private page = 0;

  constructor() {
    effect(() => {
      this.language.current();
      this.page = 0;
      this.items.set([]);
      this.fetch();
    });
  }

  protected image(n: NewsItem): string {
    return api(n.imageUrl!);
  }

  protected loadMore(): void {
    this.page++;
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.contentApi.news(this.page, PAGE_SIZE).subscribe({
      next: page => {
        this.items.update(list => [...list, ...page.items]);
        this.total.set(page.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
