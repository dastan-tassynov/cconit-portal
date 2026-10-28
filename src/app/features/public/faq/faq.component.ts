import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ContentApiService } from '../../../core/api/content-api.service';
import { FaqItem } from '../../../core/api/models';
import { LanguageService } from '../../../core/i18n/language.service';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { SiteHeaderComponent } from '../../../shared/site-header/site-header.component';

/** «Гид»: часто задаваемые вопросы. */
@Component({
  selector: 'app-faq',
  imports: [RouterLink, TranslatePipe, SiteHeaderComponent, FooterComponent],
  styleUrl: '../page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-site-header />
    <main class="container">
      <nav class="crumbs">
        <a routerLink="/">{{ 'CRUMB_HOME' | translate }}</a> <span>›</span>
        <span class="crumbs__current">{{ 'FAQ_GUIDE' | translate }}</span>
      </nav>
      <h1 class="page-title">{{ 'FAQ_TITLE' | translate }}</h1>
      <div class="faq section">
        @for (item of items(); track item.id) {
          <details class="faq__item">
            <summary>{{ item.question }}</summary>
            <p>{{ item.answer }}</p>
          </details>
        } @empty {
          <p class="muted">{{ (loading() ? 'LOADING' : 'FAQ_EMPTY') | translate }}</p>
        }
      </div>
    </main>
    <app-footer />
  `,
  styles: `
    .faq { max-width: 860px; display: flex; flex-direction: column; gap: 10px; }
    .faq__item { border: 1px solid var(--line); border-radius: 12px; padding: 16px 20px; background: #fff; }
    .faq__item summary { cursor: pointer; font-weight: 600; }
    .faq__item p { margin: 12px 0 0; color: #3f3f50; line-height: 1.6; white-space: pre-line; }
  `,
})
export class FaqComponent {
  private readonly contentApi = inject(ContentApiService);
  private readonly language = inject(LanguageService);
  protected readonly items = signal<FaqItem[]>([]);
  protected readonly loading = signal(true);

  constructor() {
    effect(() => {
      this.language.current();
      this.contentApi.faq().subscribe({
        next: items => {
          this.items.set(items);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });
  }
}
