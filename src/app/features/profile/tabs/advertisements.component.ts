import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminApiService } from '../../../core/api/admin-api.service';
import { Advertisement } from '../../../core/api/models';
import { errorMessage } from '../../../core/http/error-message';
import { ToastService } from '../../../core/ui/toast.service';

/** Баннеры на дашборде студента. */
@Component({
  selector: 'app-advertisements',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './advertisements.component.html',
  styleUrl: '../profile.shared.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvertisementsComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly toast = inject(ToastService);

  protected readonly ads = signal<Advertisement[]>([]);
  protected readonly toDelete = signal<Advertisement | null>(null);
  protected readonly saving = signal(false);
  protected image: File | null = null;

  protected readonly form = inject(FormBuilder).nonNullable.group({
    title: [''],
    linkUrl: ['', Validators.pattern(/^(https?:\/\/.+)?$/i)],
  });

  ngOnInit(): void {
    this.adminApi.getAds().subscribe(ads => this.ads.set(ads));
  }

  protected onImageSelected(event: Event): void {
    this.image = (event.target as HTMLInputElement).files?.[0] ?? null;
  }

  protected create(fileInput: HTMLInputElement): void {
    const value = this.form.getRawValue();
    if (this.form.invalid || (!this.image && !value.title.trim())) {
      this.toast.error('ADS_VALIDATION');
      return;
    }
    this.saving.set(true);
    this.adminApi.createAd({ title: value.title.trim(), linkUrl: value.linkUrl.trim(), image: this.image }).subscribe({
      next: ad => {
        this.ads.update(list => [ad, ...list]);
        this.form.reset();
        this.image = null;
        fileInput.value = '';
        this.saving.set(false);
        this.toast.success('TOAST_AD_CREATED');
      },
      error: err => {
        this.saving.set(false);
        this.toast.error(errorMessage(err, 'ERR_GENERIC'));
      },
    });
  }

  protected toggle(ad: Advertisement): void {
    this.adminApi.toggleAd(ad.id, !ad.active).subscribe({
      next: ads => this.ads.set(ads),
      error: err => this.toast.error(errorMessage(err, 'ERR_GENERIC')),
    });
  }

  protected confirmDelete(): void {
    const ad = this.toDelete();
    if (!ad) return;
    this.adminApi.deleteAd(ad.id).subscribe({
      next: ads => {
        this.ads.set(ads);
        this.toDelete.set(null);
        this.toast.success('TOAST_AD_DELETED');
      },
      error: err => this.toast.error(errorMessage(err, 'ERR_GENERIC')),
    });
  }
}
