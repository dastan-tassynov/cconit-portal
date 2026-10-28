import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { OrderApiService } from '../../core/api/order-api.service';
import { Order, PurchaseItem } from '../../core/api/models';
import { errorMessage } from '../../core/http/error-message';
import { redirectToHalyk } from '../../core/payment/halyk-pay';

/**
 * Оплата курса или участия в конкурсе. Создаёт заказ (или берёт уже открытый)
 * и отправляет на платёжную страницу Halyk ePay — как в Telegram-боте.
 * Пока Halyk не настроен на бэкенде, показывается номер счёта для Kaspi.
 */
@Component({
  selector: 'app-purchase-dialog',
  imports: [DecimalPipe, TranslatePipe],
  templateUrl: './purchase-dialog.component.html',
  styleUrl: './purchase-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseDialogComponent implements OnInit {
  private readonly orders = inject(OrderApiService);

  readonly item = input.required<PurchaseItem>();
  readonly closed = output<void>();
  readonly paid = output<Order>();

  protected readonly order = signal<Order | null>(null);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly redirecting = signal(false);
  protected readonly error = signal('');
  protected readonly notPaidYet = signal(false);

  ngOnInit(): void {
    const item = this.item();
    const request: Observable<Order> =
      item.kind === 'CONTEST' ? this.orders.createContest(item.id) : this.orders.create(item.id);
    request.subscribe({
      next: order => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(errorMessage(err, 'PAY_ERROR_CREATE'));
      },
    });
  }

  protected payByCard(): void {
    const current = this.order();
    if (!current) return;
    this.busy.set(true);
    this.error.set('');
    this.orders.startHalyk(current.id).subscribe({
      next: async data => {
        if (data.alreadyPaid) {
          this.checkStatus();
          return;
        }
        this.redirecting.set(true);
        try {
          await redirectToHalyk(data);
        } catch {
          this.redirecting.set(false);
          this.busy.set(false);
          this.error.set('PAY_SCRIPT_ERROR');
        }
      },
      error: err => this.fail(err),
    });
  }

  protected checkStatus(): void {
    const current = this.order();
    if (!current) return;
    this.busy.set(true);
    this.notPaidYet.set(false);
    this.orders.check(current.id).subscribe({
      next: order => this.handleUpdate(order),
      error: err => this.fail(err),
    });
  }

  protected payWithStub(): void {
    const current = this.order();
    if (!current) return;
    this.busy.set(true);
    this.orders.payWithStub(current.id).subscribe({
      next: order => this.handleUpdate(order),
      error: err => this.fail(err),
    });
  }

  private handleUpdate(order: Order): void {
    this.busy.set(false);
    this.order.set(order);
    if (order.status === 'PAID') {
      this.paid.emit(order);
    } else {
      this.notPaidYet.set(true);
    }
  }

  private fail(err: unknown): void {
    this.busy.set(false);
    this.error.set(errorMessage(err, 'ERR_GENERIC'));
  }
}
