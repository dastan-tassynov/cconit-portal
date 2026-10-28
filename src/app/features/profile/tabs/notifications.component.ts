import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { UnreadNotificationsService } from '../../../core/account/unread-notifications.service';
import { AccountApiService } from '../../../core/api/account-api.service';
import { AppNotification } from '../../../core/api/models';

const ICONS: Record<string, string> = {
  PAYMENT_CONFIRMED: '💳',
  CERTIFICATE_ISSUED: '🏅',
  APPLICATION_APPROVED: '✅',
  APPLICATION_REJECTED: '❌',
  PAYMENT_FAILED: '⚠️',
  CONTEST_REGISTERED: '🏆',
  NAME_CHANGE_APPROVED: '🪪',
  NAME_CHANGE_REJECTED: '🪪',
  ANNOUNCEMENT: '📢',
  QUIZ_LOCKED: '🔒',
  QUIZ_UNLOCKED: '🔓',
};

@Component({
  selector: 'app-notifications',
  imports: [DatePipe, TranslatePipe],
  styleUrl: '../cabinet.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page__head">
        <h1 class="page__title">{{ 'CAB_MENU_NOTIFICATIONS' | translate }}</h1>
        @if (hasUnread()) {
          <button type="button" class="btn btn--ghost" (click)="readAll()">{{ 'CAB_READ_ALL' | translate }}</button>
        }
      </div>
      <div class="card list">
        @for (n of items(); track n.id) {
          <button type="button" class="item" [class.item--unread]="!n.read" (click)="open(n)">
            <span class="item__icon">{{ icon(n) }}</span>
            <span class="item__body">
              <span>{{ 'NOTIF_' + n.type | translate: { param: n.param } }}</span>
              <small class="muted">{{ n.createdAt | date: 'dd.MM.yyyy HH:mm' }}</small>
            </span>
            @if (!n.read) { <span class="item__dot"></span> }
          </button>
        } @empty {
          <div class="empty"><span class="empty__icon">🔔</span>{{ (loading() ? 'LOADING' : 'CAB_NO_NOTIFICATIONS') | translate }}</div>
        }
      </div>
    </div>
  `,
  styles: `
    .list { padding: 6px; }
    .item { display: flex; align-items: center; gap: 14px; width: 100%; text-align: left; background: none; border: 0; border-radius: 10px;
            padding: 14px; cursor: pointer; font: inherit; color: inherit; }
    .item:hover { background: #f6f6f9; }
    .item--unread { background: #f0f8ff; }
    .item__icon { font-size: 22px; }
    .item__body { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .item__dot { width: 8px; height: 8px; border-radius: 50%; background: #3d37f0; }
  `,
})
export class NotificationsComponent implements OnInit {
  private readonly accountApi = inject(AccountApiService);
  private readonly unread = inject(UnreadNotificationsService);
  private readonly router = inject(Router);

  protected readonly items = signal<AppNotification[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.accountApi.notifications().subscribe({
      next: items => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected hasUnread(): boolean {
    return this.items().some(n => !n.read);
  }

  protected icon(n: AppNotification): string {
    return ICONS[n.type] ?? '🔔';
  }

  protected open(n: AppNotification): void {
    if (!n.read) {
      this.accountApi.markRead(n.id).subscribe(() => this.unread.refresh());
      this.items.update(list => list.map(i => (i.id === n.id ? { ...i, read: true } : i)));
    }
    if (n.link) {
      this.router.navigateByUrl(n.link);
    }
  }

  protected readAll(): void {
    this.accountApi.markAllRead().subscribe(() => {
      this.items.update(list => list.map(i => ({ ...i, read: true })));
      this.unread.refresh();
    });
  }
}
