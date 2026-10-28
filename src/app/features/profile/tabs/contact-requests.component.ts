import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { PhonePipe } from '../../../shared/phone-input/phone.pipe';
import { AdminApiService } from '../../../core/api/admin-api.service';
import { ContactRequest } from '../../../core/api/models';
import { ToastService } from '../../../core/ui/toast.service';

/** Заявки из формы «У вас есть вопросы?» на главной. */
@Component({
  selector: 'app-contact-requests',
  imports: [DatePipe, TranslatePipe, PhonePipe],
  styleUrl: '../profile.shared.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3 class="section-title">📨 {{ 'MENU_CONTACT_REQUESTS' | translate }}</h3>
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ 'TH_DATE' | translate }}</th>
            <th>{{ 'TH_NAME' | translate }}</th>
            <th>{{ 'TH_CONTACTS' | translate }}</th>
            <th>{{ 'TH_MESSAGE' | translate }}</th>
            <th class="text-right">{{ 'TH_STATUS' | translate }}</th>
          </tr>
        </thead>
        <tbody>
          @for (r of requests(); track r.id) {
            <tr [class.muted]="r.processed">
              <td>{{ r.createdAt | date: 'dd.MM.yyyy HH:mm' }}</td>
              <td>{{ r.name }}</td>
              <td>
                @if (r.phone) { <a [href]="'tel:' + r.phone">{{ r.phone | phone }}</a><br> }
                @if (r.email) { <a [href]="'mailto:' + r.email">{{ r.email }}</a> }
              </td>
              <td>{{ r.message }}</td>
              <td class="text-right">
                <button type="button" class="btn-small" [class.btn-small--green]="!r.processed" [class.btn-small--amber]="r.processed"
                        (click)="toggle(r)">
                  {{ (r.processed ? 'CONTACT_REOPEN' : 'CONTACT_DONE') | translate }}
                </button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="5" class="muted">{{ 'CONTACT_EMPTY' | translate }}</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class ContactRequestsComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly toast = inject(ToastService);
  protected readonly requests = signal<ContactRequest[]>([]);

  ngOnInit(): void {
    this.adminApi.getContactRequests().subscribe(list => this.requests.set(list));
  }

  protected toggle(request: ContactRequest): void {
    const processed = !request.processed;
    this.adminApi.setContactProcessed(request.id!, processed).subscribe({
      next: () => this.requests.update(list => list.map(r => (r.id === request.id ? { ...r, processed } : r))),
      error: () => this.toast.error('ERR_GENERIC'),
    });
  }
}
