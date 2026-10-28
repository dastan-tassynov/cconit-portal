import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ContentApiService } from '../../../core/api/content-api.service';
import { NewsItem } from '../../../core/api/models';
import { api } from '../../../core/http/api-url';
import { LanguageService } from '../../../core/i18n/language.service';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { SiteHeaderComponent } from '../../../shared/site-header/site-header.component';

@Component({
  selector: 'app-news-detail',
  imports: [RouterLink, DatePipe, TranslatePipe, SiteHeaderComponent, FooterComponent],
  styleUrls: ['../page.css', './news.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-site-header />
    <main class="container">
      @if (item(); as n) {
        <nav class="crumbs">
          <a routerLink="/">{{ 'CRUMB_HOME' | translate }}</a> <span>›</span>
          <a routerLink="/news">{{ 'SITE_NEWS_TITLE' | translate }}</a> <span>›</span>
          <span class="crumbs__current">{{ n.title }}</span>
        </nav>
        <article class="article">
          <h1 class="page-title">{{ n.title }}</h1>
          <p class="muted">{{ n.publishedAt | date: 'dd.MM.yyyy' }} · 👁 {{ n.views }} {{ 'NEWS_VIEWS' | translate }}</p>
          @if (n.imageUrl) { <img [src]="image(n.imageUrl)" alt="" class="article__img"> }
          <div class="article__body">{{ n.body }}</div>
        </article>
      } @else if (notFound()) {
        <h1 class="page-title section">{{ 'NEWS_NOT_FOUND' | translate }}</h1>
      } @else {
        <p class="muted section">{{ 'LOADING' | translate }}</p>
      }
    </main>
    <app-footer />
  `,
})
export class NewsDetailComponent {
  private readonly contentApi = inject(ContentApiService);
  private readonly language = inject(LanguageService);

  readonly id = input.required<string>();
  protected readonly item = signal<NewsItem | null>(null);
  protected readonly notFound = signal(false);

  constructor() {
    effect(() => {
      const id = Number(this.id());
      this.language.current();
      this.contentApi.newsItem(id).subscribe({
        next: n => this.item.set(n),
        error: () => this.notFound.set(true),
      });
    });
  }

  protected image(url: string): string {
    return api(url);
  }
}
