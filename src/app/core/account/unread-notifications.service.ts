import { Injectable, inject, signal } from '@angular/core';
import { AccountApiService } from '../api/account-api.service';

/** Счётчик непрочитанных уведомлений — общий для колокольчика и страницы уведомлений. */
@Injectable({ providedIn: 'root' })
export class UnreadNotificationsService {
  private readonly accountApi = inject(AccountApiService);
  readonly count = signal(0);

  refresh(): void {
    this.accountApi.unreadCount().subscribe({
      next: r => this.count.set(r.count),
      error: () => undefined,
    });
  }
}
