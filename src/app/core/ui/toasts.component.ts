import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toasts',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div [class]="'toast toast--' + toast.type" (click)="toastService.dismiss(toast.id)">
          {{ toast.message | translate }}
        </div>
      }
    </div>
  `,
  styles: `
    .toasts { position: fixed; right: 16px; bottom: 16px; z-index: 2000; display: flex; flex-direction: column; gap: 8px; max-width: min(380px, calc(100vw - 32px)); }
    .toast { padding: 12px 16px; border-radius: 10px; color: #fff; font-size: 14px; box-shadow: 0 8px 24px rgb(0 0 0 / .15); cursor: pointer; animation: in .2s ease-out; }
    .toast--success { background: #059669; }
    .toast--error { background: #dc2626; }
    .toast--info { background: #2563eb; }
    @keyframes in { from { opacity: 0; transform: translateY(8px); } }
  `,
})
export class ToastsComponent {
  protected readonly toastService = inject(ToastService);
}
