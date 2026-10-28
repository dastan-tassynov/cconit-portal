import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AccountApiService } from '../../../core/api/account-api.service';
import { EducationDocument, Profile } from '../../../core/api/models';
import { SessionService } from '../../../core/auth/session.service';
import { errorMessage } from '../../../core/http/error-message';
import { ToastService } from '../../../core/ui/toast.service';
import { saveBlob } from '../../../core/utils/download';
import { normalizePhone, phoneErrorKey, phoneValidator } from '../../../core/utils/phone';
import { PhoneInputComponent } from '../../../shared/phone-input/phone-input.component';

/** Анкета: личная и профессиональная информация, документы об образовании, % заполнения. */
@Component({
  selector: 'app-account',
  imports: [ReactiveFormsModule, DecimalPipe, TranslatePipe, PhoneInputComponent],
  templateUrl: './account.component.html',
  styleUrls: ['../cabinet.css', './account.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountComponent implements OnInit {
  private readonly accountApi = inject(AccountApiService);
  private readonly session = inject(SessionService);
  private readonly toast = inject(ToastService);

  /** Подсказки для полей (можно ввести и своё значение). */
  protected readonly regions = [
    'г. Астана', 'г. Алматы', 'г. Шымкент', 'Абайская область', 'Акмолинская область', 'Актюбинская область',
    'Алматинская область', 'Атырауская область', 'Восточно-Казахстанская область', 'Жамбылская область',
    'Жетысуская область', 'Западно-Казахстанская область', 'Карагандинская область', 'Костанайская область',
    'Кызылординская область', 'Мангистауская область', 'Павлодарская область', 'Северо-Казахстанская область',
    'Туркестанская область', 'Улытауская область',
  ];
  protected readonly positions = [
    'Учитель', 'Воспитатель', 'Педагог-психолог', 'Педагог-дефектолог', 'Логопед', 'Социальный педагог',
    'Заместитель директора', 'Директор', 'Методист', 'Преподаватель колледжа', 'Педагог дополнительного образования',
  ];

  protected readonly profile = signal<Profile | null>(null);
  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    middleName: ['', Validators.maxLength(100)],
    phoneNumber: ['', phoneValidator()],
    region: ['', Validators.maxLength(150)],
    position: ['', Validators.maxLength(150)],
    workplace: ['', Validators.maxLength(300)],
  });

  ngOnInit(): void {
    this.accountApi.profile().subscribe(profile => this.apply(profile));
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.accountApi.updateProfile(this.form.getRawValue()).subscribe({
      next: profile => {
        this.apply(profile);
        this.session.updateFullName(profile.fullName ?? '');
        this.saving.set(false);
        this.toast.success(profile.pendingFullName ? 'CAB_NAME_REQUEST_SENT' : 'CAB_PROFILE_SAVED');
      },
      error: err => {
        this.saving.set(false);
        this.toast.error(errorMessage(err, 'ERR_GENERIC'));
      },
    });
  }

  protected reset(): void {
    const p = this.profile();
    if (p) this.apply(p);
  }

  protected upload(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.accountApi.uploadDocument(file).subscribe({
      next: doc => {
        input.value = '';
        this.uploading.set(false);
        this.reloadAfterDocumentChange(list => [...list, doc]);
      },
      error: err => {
        input.value = '';
        this.uploading.set(false);
        this.toast.error(errorMessage(err, 'ERR_GENERIC'));
      },
    });
  }

  protected download(doc: EducationDocument): void {
    this.accountApi.downloadDocument(doc.id).subscribe(blob => saveBlob(blob, doc.name));
  }

  protected remove(doc: EducationDocument): void {
    this.accountApi.deleteDocument(doc.id).subscribe({
      next: () => this.reloadAfterDocumentChange(list => list.filter(d => d.id !== doc.id)),
      error: err => this.toast.error(errorMessage(err, 'ERR_GENERIC')),
    });
  }

  protected readonly phoneError = () => phoneErrorKey(this.form.controls.phoneNumber.errors);

  protected invalid(name: 'lastName' | 'firstName' | 'phoneNumber'): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  /** Документы меняют % заполнения — перечитываем анкету с сервера. */
  private reloadAfterDocumentChange(update: (list: EducationDocument[]) => EducationDocument[]): void {
    this.profile.update(p => (p ? { ...p, documents: update(p.documents) } : p));
    this.accountApi.profile().subscribe(profile => this.profile.set(profile));
  }

  private apply(profile: Profile): void {
    this.profile.set(profile);
    this.form.reset({
      lastName: profile.lastName ?? '',
      firstName: profile.firstName ?? '',
      middleName: profile.middleName ?? '',
      phoneNumber: normalizePhone(profile.phoneNumber),
      region: profile.region ?? '',
      position: profile.position ?? '',
      workplace: profile.workplace ?? '',
    });
  }
}
