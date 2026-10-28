import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminApiService } from '../../../core/api/admin-api.service';
import { AdminFaq, AdminNews } from '../../../core/api/models';
import { errorMessage } from '../../../core/http/error-message';
import { ToastService } from '../../../core/ui/toast.service';

/** Контент сайта: новости и частые вопросы (RU/KZ). */
@Component({
  selector: 'app-content-admin',
  imports: [ReactiveFormsModule, DatePipe, TranslatePipe],
  templateUrl: './content-admin.component.html',
  styleUrl: '../profile.shared.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentAdminComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly tab = signal<'news' | 'faq'>('news');
  protected readonly news = signal<AdminNews[]>([]);
  protected readonly faq = signal<AdminFaq[]>([]);
  protected newsImage: File | null = null;

  protected readonly newsForm = this.fb.group({
    id: this.fb.control<number | null>(null),
    titleRu: ['', [Validators.required, Validators.maxLength(300)]],
    titleKz: ['', Validators.maxLength(300)],
    bodyRu: [''],
    bodyKz: [''],
    published: [true],
  });

  protected readonly faqForm = this.fb.group({
    id: this.fb.control<number | null>(null),
    questionRu: ['', Validators.required],
    questionKz: [''],
    answerRu: ['', Validators.required],
    answerKz: [''],
    sortOrder: [0],
  });

  ngOnInit(): void {
    this.adminApi.getNews().subscribe(n => this.news.set(n));
    this.adminApi.getFaq().subscribe(f => this.faq.set(f));
  }

  // ---------------------------------------------------------------- новости

  protected editNews(n: AdminNews): void {
    this.newsForm.setValue({
      id: n.id ?? null, titleRu: n.titleRu, titleKz: n.titleKz ?? '', bodyRu: n.bodyRu ?? '', bodyKz: n.bodyKz ?? '', published: n.published,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected resetNews(imageInput?: HTMLInputElement): void {
    this.newsForm.reset({ id: null, titleRu: '', titleKz: '', bodyRu: '', bodyKz: '', published: true });
    this.newsImage = null;
    if (imageInput) imageInput.value = '';
  }

  protected onNewsImage(event: Event): void {
    this.newsImage = (event.target as HTMLInputElement).files?.[0] ?? null;
  }

  protected saveNews(imageInput: HTMLInputElement): void {
    if (this.newsForm.invalid) {
      this.newsForm.markAllAsTouched();
      return;
    }
    const v = this.newsForm.getRawValue();
    this.adminApi.saveNews({ ...v, id: v.id ?? undefined }).subscribe({
      next: saved => {
        const image = this.newsImage;
        if (image && saved.id) {
          this.adminApi.uploadNewsImage(saved.id, image).subscribe(withImage => this.upsertNews(withImage));
        } else {
          this.upsertNews(saved);
        }
        this.toast.success('TOAST_SAVED');
        this.resetNews(imageInput);
      },
      error: err => this.toast.error(errorMessage(err, 'ERR_GENERIC')),
    });
  }

  protected deleteNews(n: AdminNews): void {
    if (!n.id || !confirm(n.titleRu + '?')) return;
    this.adminApi.deleteNews(n.id).subscribe(() => this.news.update(list => list.filter(x => x.id !== n.id)));
  }

  // ---------------------------------------------------------------- FAQ

  protected editFaq(f: AdminFaq): void {
    this.faqForm.setValue({
      id: f.id ?? null, questionRu: f.questionRu, questionKz: f.questionKz ?? '',
      answerRu: f.answerRu, answerKz: f.answerKz ?? '', sortOrder: f.sortOrder,
    });
  }

  protected resetFaq(): void {
    this.faqForm.reset({ id: null, questionRu: '', questionKz: '', answerRu: '', answerKz: '', sortOrder: 0 });
  }

  protected saveFaq(): void {
    if (this.faqForm.invalid) {
      this.faqForm.markAllAsTouched();
      return;
    }
    const v = this.faqForm.getRawValue();
    this.adminApi.saveFaq({ ...v, id: v.id ?? undefined }).subscribe({
      next: saved => {
        this.faq.update(list => {
          const rest = list.filter(x => x.id !== saved.id);
          return [...rest, saved].sort((a, b) => a.sortOrder - b.sortOrder);
        });
        this.toast.success('TOAST_SAVED');
        this.resetFaq();
      },
      error: err => this.toast.error(errorMessage(err, 'ERR_GENERIC')),
    });
  }

  protected deleteFaq(f: AdminFaq): void {
    if (!f.id || !confirm(f.questionRu + '?')) return;
    this.adminApi.deleteFaq(f.id).subscribe(() => this.faq.update(list => list.filter(x => x.id !== f.id)));
  }

  private upsertNews(item: AdminNews): void {
    this.news.update(list => [item, ...list.filter(x => x.id !== item.id)]);
  }
}
