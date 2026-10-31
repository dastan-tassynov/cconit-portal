import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { SessionService } from '../auth/session.service';
import { api } from '../http/api-url';
import { AuthResponse, LoginRequest, MessageResponse, PortalUser, RegisterRequest, RegisterResponse } from './models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(api('/api/auth/login'), request)
      .pipe(tap(response => this.session.start(response)));
  }

  /** Регистрация. Если код из письма отключён на сервере — сразу вход. */
  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(api('/api/auth/register'), request).pipe(
      tap(response => {
        if (!response.verificationRequired && response.auth) this.session.start(response.auth);
      }),
    );
  }

  /** Код из письма; при успехе сразу вход. */
  verifyEmail(email: string, code: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(api('/api/auth/verify-email'), { email, code })
      .pipe(tap(response => this.session.start(response)));
  }

  resendCode(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(api('/api/auth/resend-code'), { email });
  }

  me(): Observable<PortalUser> {
    return this.http.get<PortalUser>(api('/api/auth/me'));
  }

  logout(): void {
    this.session.clear();
  }
}
