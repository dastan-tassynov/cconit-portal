import { ChangeDetectionStrategy, Component, OnInit, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminApiService } from '../../../core/api/admin-api.service';
import { ContentApiService } from '../../../core/api/content-api.service';
import { Application, ApplicationStatus, ApplicationType, SiteSettings } from '../../../core/api/models';
import { errorMessage } from '../../../core/http/error-message';
import { ToastService } from '../../../core/ui/toast.service';
import { saveBlob } from '../../../core/utils/download';

/** Модерация заявок в рабочие группы и лекторы + переключатели приёма заявок. */
@Component({
  selector: 'app-applications-admin',
  imports: [FormsModule, DatePipe, TranslatePipe],
  templateUrl: './applications-admin.component.html',
  styleUrl: '../profile.shared.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationsAdminComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly contentApi = inject(ContentApiService);
  private readonly toast = inject(ToastService);

  protected readonly type = signal<ApplicationType>('WORKGROUP');
  protected readonly items = signal<Application[]>([]);
  protected readonly settings = signal<SiteSettings | null>(null);
  protected readonly comments: Record<number, string> = {};
  protected readonly documents = signal<Record<number, { id: number; name: string }[]>>({});

  constructor() {
    effect(() => {
      const type = this.type();
      this.adminApi.getApplications(type).subscribe(items => this.items.set(items));
    });
  }

  ngOnInit(): void {
    this.contentApi.settings().subscribe(s => this.settings.set(s));
  }

  protected toggleOpen(key: keyof SiteSettings): void {
    const current = this.settings();
    if (!current) return;
    const next = { ...current, [key]: !current[key] };
    this.adminApi.updateSettings(next).subscribe({
      next: saved => this.settings.set(saved),
      error: err => this.toast.error(errorMessage(err, 'ERR_GENERIC')),
    });
  }

  protected decide(app: Application, status: ApplicationStatus): void {
    this.adminApi.decideApplication(app.id, status, this.comments[app.id]).subscribe({
      next: updated => this.items.update(list => list.map(a => (a.id === updated.id ? updated : a))),
      error: err => this.toast.error(errorMessage(err, 'ERR_GENERIC')),
    });
  }

  protected loadDocuments(app: Application): void {
    if (!app.userId) return;
    const userId = app.userId;
    this.adminApi.getUserDocuments(userId).subscribe(docs =>
      this.documents.update(map => ({ ...map, [userId]: docs.map(d => ({ id: d.id, name: d.name })) })));
  }

  protected download(doc: { id: number; name: string }): void {
    this.adminApi.downloadUserDocument(doc.id).subscribe(blob => saveBlob(blob, doc.name));
  }
}
