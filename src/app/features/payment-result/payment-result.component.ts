import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Subscription, timer } from 'rxjs';
import { Order } from '../../core/api/models';
import { OrderApiService } from '../../core/api/order-api.service';
import { FooterComponent } from '../../shared/footer/footer.component';
import { SiteHeaderComponent } from '../../shared/site-header/site-header.component';

const POLL_MS = 4000;
const MAX_ATTEMPTS = 20;

/**
 * Сюда Halyk возвращает после оплаты. Банк подтверждает платёж не мгновенно,
 * поэтому несколько раз спрашиваем статус у бэкенда (он, в свою очередь, — у банка).
 */
@Component({
  selector: 'app-payment-result',
  imports: [DecimalPipe, RouterLink, TranslatePipe, SiteHeaderComponent, FooterComponent],
  styleUrl: '../public/page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-site-header />
    <main class="container section">
      <div class="result">
        @switch (state()) {
          @case ('paid') {
            <div class="result__icon">✅</div>
            <h1 class="page-title">{{ 'PAYRES_PAID' | translate }}</h1>
            @if (order(); as o) { <p class="muted">{{ o.subjectTitle }} · {{ o.amount | number: '1.0-0' }} ₸</p> }
            <a class="btn btn--primary" [routerLink]="nextLink()">{{ nextKey() | translate }}</a>
          }
          @case ('failed') {
            <div class="result__icon">❌</div>
            <h1 class="page-title">{{ 'PAYRES_FAILED' | translate }}</h1>
            <p class="muted">{{ 'PAYRES_FAILED_TEXT' | translate }}</p>
            <a class="btn btn--outline" [routerLink]="backLink()">{{ 'PAYRES_TRY_AGAIN' | translate }}</a>
          }
          @case ('waiting') {
            <div class="result__icon">⏳</div>
            <h1 class="page-title">{{ 'PAYRES_WAITING' | translate }}</h1>
            <p class="muted">{{ 'PAYRES_WAITING_TEXT' | translate }}</p>
            <button type="button" class="btn btn--outline" (click)="check()">{{ 'PAY_CHECK' | translate }}</button>
          }
          @default {
            <div class="result__icon">🔄</div>
            <h1 class="page-title">{{ 'PAYRES_CHECKING' | translate }}</h1>
          }
        }
      </div>
    </main>
    <app-footer />
  `,
  styles: `
    .result { max-width: 560px; margin: 40px auto; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .result__icon { font-size: 56px; }
    .result .btn { margin-top: 16px; }
  `,
})
export class PaymentResultComponent implements OnInit {
  private readonly orders = inject(OrderApiService);
  private readonly destroyRef = inject(DestroyRef);

  /** ?order=ID */
  readonly orderId = input<string>('', { alias: 'order' });
  /** ?failed=1 — банк вернул на failureBackLink */
  readonly failed = input<string>();

  protected readonly order = signal<Order | null>(null);
  protected readonly state = signal<'checking' | 'paid' | 'failed' | 'waiting'>('checking');
  private poll?: Subscription;

  ngOnInit(): void {
    const id = Number(this.orderId());
    if (!id) {
      this.state.set('failed');
      return;
    }
    let attempts = 0;
    this.poll = timer(0, POLL_MS).subscribe(() => {
      attempts++;
      // с failureBackLink ждём недолго: банк уже сказал, что оплата не прошла
      this.request(id, attempts >= (this.failed() ? 3 : MAX_ATTEMPTS));
    });
    this.destroyRef.onDestroy(() => this.poll?.unsubscribe());
  }

  protected check(): void {
    const id = Number(this.orderId());
    if (id) {
      this.state.set('checking');
      this.request(id, true);
    }
  }

  protected nextLink(): string {
    const o = this.order();
    return o?.kind === 'CONTEST' ? '/profile/contests' : `/course/${o?.subjectId}`;
  }

  protected nextKey(): string {
    return this.order()?.kind === 'CONTEST' ? 'PAYRES_TO_CONTESTS' : 'PAYRES_TO_COURSE';
  }

  protected backLink(): string {
    const o = this.order();
    if (!o) return '/courses';
    return o.kind === 'CONTEST' ? '/contests' : `/courses/${o.subjectId}`;
  }

  private request(id: number, last: boolean): void {
    this.orders.check(id).subscribe({
      next: order => {
        this.order.set(order);
        if (order.status === 'PAID') {
          this.finish('paid');
        } else if (order.status === 'FAILED' || order.status === 'CANCELLED') {
          this.finish('failed');
        } else if (last) {
          this.finish(this.failed() ? 'failed' : 'waiting');
        }
      },
      error: () => last && this.finish('waiting'),
    });
  }

  private finish(state: 'paid' | 'failed' | 'waiting'): void {
    this.poll?.unsubscribe();
    this.state.set(state);
  }
}
