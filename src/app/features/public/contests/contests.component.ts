import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ContentApiService } from '../../../core/api/content-api.service';
import { Contest, ContestNomination, PurchaseItem } from '../../../core/api/models';
import { SessionService } from '../../../core/auth/session.service';
import { LanguageService } from '../../../core/i18n/language.service';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { PurchaseDialogComponent } from '../../../shared/purchase-dialog/purchase-dialog.component';
import { SiteHeaderComponent } from '../../../shared/site-header/site-header.component';

/** «Конкурсы» (из Telegram-бота): номинации фестиваля, оплата участия, номер участника. */
@Component({
  selector: 'app-contests',
  imports: [DecimalPipe, RouterLink, TranslatePipe, SiteHeaderComponent, FooterComponent, PurchaseDialogComponent],
  styleUrl: '../page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-site-header />
    <main class="container">
      <nav class="crumbs">
        <a routerLink="/">{{ 'CRUMB_HOME' | translate }}</a> <span>›</span>
        <span class="crumbs__current">{{ 'CONTESTS_TITLE' | translate }}</span>
      </nav>
      <h1 class="page-title">{{ 'CONTESTS_TITLE' | translate }}</h1>
      <p class="lead">{{ 'CONTESTS_LEAD' | translate }}</p>

      <div class="section contests">
        @for (contest of contests(); track contest.id) {
          <article class="contest">
            <header class="contest__head">
              <h2>{{ contest.title }}</h2>
              <span class="contest__price">{{ contest.price | number: '1.0-0' }} ₸ <small>/ {{ 'CONTESTS_PER_NOMINATION' | translate }}</small></span>
            </header>
            @if (contest.description) { <p class="contest__desc">{{ contest.description }}</p> }

            <h3 class="contest__sub">{{ 'CONTESTS_NOMINATIONS' | translate }}</h3>
            <div class="nominations">
              @for (n of contest.nominations; track n.id) {
                <div class="nomination" [class.nomination--joined]="n.joined">
                  <span>{{ n.title }}</span>
                  @if (n.joined) {
                    <a class="badge" routerLink="/profile/contests">✓ {{ 'CONTESTS_JOINED' | translate }}</a>
                  } @else {
                    <button type="button" class="btn btn--primary btn--sm" (click)="join(contest, n)">{{ 'CONTESTS_JOIN' | translate }}</button>
                  }
                </div>
              }
            </div>
            @if (contest.materialsEmail) {
              <p class="muted contest__mail">📩 {{ 'CONTESTS_SEND_MATERIALS' | translate }} <b>{{ contest.materialsEmail }}</b></p>
            }
          </article>
        } @empty {
          <p class="muted">{{ (loading() ? 'LOADING' : 'CONTESTS_EMPTY') | translate }}</p>
        }
      </div>
    </main>
    <app-footer />

    @if (purchase(); as item) {
      <app-purchase-dialog [item]="item" (closed)="purchase.set(null)" (paid)="onPaid()" />
    }
  `,
  styles: `
    .contests { display: flex; flex-direction: column; gap: 28px; }
    .contest { border: 1px solid var(--line); border-radius: 18px; padding: 28px; background: #fff; }
    .contest__head { display: flex; justify-content: space-between; gap: 16px; align-items: baseline; flex-wrap: wrap; }
    .contest__head h2 { margin: 0; font-size: 24px; }
    .contest__price { font-size: 22px; font-weight: 800; color: var(--primary); }
    .contest__price small { font-size: 13px; color: var(--muted); font-weight: 500; }
    .contest__desc { white-space: pre-line; line-height: 1.6; color: #3f3f50; background: var(--lavender); border-radius: 12px; padding: 16px 18px; }
    .contest__sub { margin: 24px 0 12px; font-size: 17px; }
    .nominations { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; }
    .nomination { display: flex; justify-content: space-between; align-items: center; gap: 12px; border: 1px solid var(--line);
                  border-radius: 12px; padding: 12px 14px; }
    .nomination--joined { background: #f0fdf4; border-color: #bbf7d0; }
    .btn--sm { padding: 8px 14px; font-size: 13px; white-space: nowrap; }
    .badge { color: #15803d; font-weight: 600; font-size: 13px; white-space: nowrap; text-decoration: none; }
    .contest__mail { margin: 18px 0 0; }
  `,
})
export class ContestsComponent {
  private readonly contentApi = inject(ContentApiService);
  private readonly language = inject(LanguageService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly contests = signal<Contest[]>([]);
  protected readonly loading = signal(true);
  protected readonly purchase = signal<PurchaseItem | null>(null);

  constructor() {
    effect(() => {
      this.language.current();
      this.load();
    });
  }

  protected join(contest: Contest, nomination: ContestNomination): void {
    if (!this.session.isLoggedIn()) {
      this.router.navigate(['/register'], { queryParams: { returnUrl: '/contests' } });
      return;
    }
    this.purchase.set({ kind: 'CONTEST', id: nomination.id, title: `${contest.title} — ${nomination.title}` });
  }

  protected onPaid(): void {
    this.purchase.set(null);
    this.router.navigate(['/profile/contests']);
  }

  private load(): void {
    this.contentApi.contests().subscribe({
      next: contests => {
        this.contests.set(contests);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
