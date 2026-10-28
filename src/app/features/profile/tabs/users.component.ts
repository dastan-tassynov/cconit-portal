import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminApiService } from '../../../core/api/admin-api.service';
import { PortalUser } from '../../../core/api/models';
import { errorMessage } from '../../../core/http/error-message';
import { ToastService } from '../../../core/ui/toast.service';

/** Пользователи и роли (только SUPERADMIN — проверяется и на бэкенде). */
@Component({
  selector: 'app-users',
  imports: [TranslatePipe],
  styleUrl: '../profile.shared.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3 class="section-title">{{ 'TITLE_ROLES' | translate }}</h3>
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ 'TH_NAME' | translate }}</th>
            <th>E-mail</th>
            <th>{{ 'TH_ROLE' | translate }}</th>
            <th class="text-right">{{ 'TH_ACTION' | translate }}</th>
          </tr>
        </thead>
        <tbody>
          @for (user of users(); track user.id) {
            <tr>
              <td>{{ user.fullName }}</td>
              <td class="muted">{{ user.username }}</td>
              <td>
                @for (role of user.roles; track role) {
                  <span class="pill pill--info">{{ 'ROLE_' + role | translate }}</span>
                }
              </td>
              <td class="text-right">
                @if (!user.roles.includes('ROLE_SUPERADMIN')) {
                  <button type="button" class="btn-small"
                          [class.btn-small--amber]="isAdmin(user)" [class.btn-small--green]="!isAdmin(user)"
                          [disabled]="busyId() === user.id" (click)="toggleAdmin(user)">
                    {{ (isAdmin(user) ? 'BTN_REMOVE_ADMIN' : 'BTN_GIVE_ADMIN') | translate }}
                  </button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class UsersComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly toast = inject(ToastService);

  protected readonly users = signal<PortalUser[]>([]);
  protected readonly busyId = signal<number | null>(null);

  ngOnInit(): void {
    this.adminApi.getUsers().subscribe(users => this.users.set(users));
  }

  protected isAdmin(user: PortalUser): boolean {
    return user.roles.includes('ROLE_ADMIN');
  }

  protected toggleAdmin(user: PortalUser): void {
    this.busyId.set(user.id);
    this.adminApi.changeRole(user.id, this.isAdmin(user) ? 'ROLE_USER' : 'ROLE_ADMIN').subscribe({
      next: updated => {
        this.users.update(list => list.map(u => (u.id === updated.id ? updated : u)));
        this.busyId.set(null);
      },
      error: err => {
        this.busyId.set(null);
        this.toast.error(errorMessage(err, 'ERR_GENERIC'));
      },
    });
  }
}
