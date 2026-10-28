import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AccountApiService } from '../../../core/api/account-api.service';
import { MyContestEntry } from '../../../core/api/models';

/** «Мои конкурсы»: номинации, где пользователь зарегистрирован, и номер участника. */
@Component({
  selector: 'app-my-contests',
  imports: [DatePipe, RouterLink, TranslatePipe],
  styleUrl: '../cabinet.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="page__head">
        <h1 class="page__title">{{ 'CAB_MENU_CONTESTS' | translate }}</h1>
        <a class="btn btn--primary" routerLink="/contests">{{ 'CONTESTS_ALL' | translate }}</a>
      </div>
      @for (e of entries(); track e.id) {
        <div class="card entry">
          <div class="entry__number">№ {{ e.participantNumber }}</div>
          <div class="entry__body">
            <h3>{{ e.nominationTitle }}</h3>
            <p class="muted">{{ e.contestTitle }} · {{ e.createdAt | date: 'dd.MM.yyyy' }}</p>
            @if (e.materialsEmail) {
              <p class="entry__mail">📩 {{ 'CONTESTS_SEND_MATERIALS' | translate }} <b>{{ e.materialsEmail }}</b></p>
            }
          </div>
        </div>
      } @empty {
        <div class="card empty">
          <span class="empty__icon">🏆</span>
          {{ (loading() ? 'LOADING' : 'CONTESTS_MINE_EMPTY') | translate }}
        </div>
      }
    </div>
  `,
  styles: `
    .entry { display: flex; gap: 20px; align-items: center; }
    .entry__number { min-width: 92px; text-align: center; font-size: 22px; font-weight: 800; color: var(--primary);
                     background: #f4f4fe; border-radius: 12px; padding: 18px 10px; }
    .entry__body h3 { margin: 0 0 4px; }
    .entry__body p { margin: 0; }
    .entry__mail { margin-top: 10px !important; line-height: 1.5; }
    @media (max-width: 560px) { .entry { flex-direction: column; align-items: flex-start; } }
  `,
})
export class MyContestsComponent implements OnInit {
  private readonly accountApi = inject(AccountApiService);
  protected readonly entries = signal<MyContestEntry[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.accountApi.myContests().subscribe({
      next: entries => {
        this.entries.set(entries);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
