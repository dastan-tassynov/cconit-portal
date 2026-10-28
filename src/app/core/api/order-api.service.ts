import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { api } from '../http/api-url';
import { HalykPayment, Order } from './models';

@Injectable({ providedIn: 'root' })
export class OrderApiService {
  private readonly http = inject(HttpClient);

  create(subjectId: number): Observable<Order> {
    return this.http.post<Order>(api('/api/student/orders'), { subjectId });
  }

  /** Заказ на участие в номинации конкурса. */
  createContest(nominationId: number): Observable<Order> {
    return this.http.post<Order>(api(`/api/student/contests/nominations/${nominationId}/order`), null);
  }

  /** Параметры оплаты картой (Halyk ePay). */
  startHalyk(orderId: number): Observable<HalykPayment> {
    return this.http.post<HalykPayment>(api(`/api/student/orders/${orderId}/halyk`), null);
  }

  /** Спросить у банка статус оплаты. */
  check(orderId: number): Observable<Order> {
    return this.http.post<Order>(api(`/api/student/orders/${orderId}/check`), null);
  }

  get(orderId: number): Observable<Order> {
    return this.http.get<Order>(api(`/api/student/orders/${orderId}`));
  }

  list(): Observable<Order[]> {
    return this.http.get<Order[]>(api('/api/student/orders'));
  }

  /** Тестовая оплата — доступна, только пока на бэкенде включена заглушка Kaspi. */
  payWithStub(orderId: number): Observable<Order> {
    return this.http.post<Order>(api(`/api/student/orders/${orderId}/stub-pay`), null);
  }
}
