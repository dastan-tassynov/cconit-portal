import { Injectable, inject } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';
import { AccountApiService } from '../api/account-api.service';

/** Пройдена ли анкета слушателя. Ответ «да» кэшируется до перезагрузки страницы. */
@Injectable({ providedIn: 'root' })
export class SurveyStatusService {
  private readonly accountApi = inject(AccountApiService);
  private completed = false;

  isCompleted(): Observable<boolean> {
    if (this.completed) {
      return of(true);
    }
    return this.accountApi.survey().pipe(
      map(survey => survey.completed),
      tap(done => (this.completed = done)),
    );
  }

  markCompleted(): void {
    this.completed = true;
  }
}
