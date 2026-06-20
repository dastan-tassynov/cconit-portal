import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Observable, tap } from 'rxjs';

// Роли соответствуют нашему бэкенду Spring Boot
export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_SUPERADMIN';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://c49w5cwg79ul.share.zrok.io/api/auth';

  private isAuthenticatedUser = false;
  private currentUserRole: UserRole = 'ROLE_USER';

  constructor(private http: HttpClient) {
    // При старте приложения проверяем, авторизован ли пользователь ранее
    this.isAuthenticatedUser = !!localStorage.getItem('token');
    this.currentUserRole = (localStorage.getItem('userRole') as UserRole) || 'ROLE_USER';
  }

  changeUserRole(userId: number | string, role: string): Observable<any> {
    return this.http.put<any>(`/api/users/${userId}/role`, { role });
  }

  isLoggedIn(): boolean {
    return this.isAuthenticatedUser;
  }

  getUserRole(): UserRole {
    return this.currentUserRole;
  }

  // Вход принимает объект { username, password } и сохраняет JWT-токен
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        if (response.token) {
          this.isAuthenticatedUser = true;

          // Вытаскиваем роль, прилетевшую из базы данных
          const roleFromBack = response.roles && response.roles.length > 0 ? response.roles[0] : 'ROLE_USER';
          this.currentUserRole = roleFromBack as UserRole;

          // Пишем данные сессии в localStorage
          localStorage.setItem('token', response.token);
          localStorage.setItem('userRole', this.currentUserRole);
          localStorage.setItem('fullName', response.fullName || response.username);
        }
      })
    );
  }

  // Регистрация на бэкенде
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
  getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });
  }

  // Метод ручной смены роли (для дебага в кабинете, если нужен)
  changeRoleDebug(role: UserRole): void {
    this.currentUserRole = role;
    localStorage.setItem('userRole', role);
  }

  logout(): void {
    this.isAuthenticatedUser = false;
    this.currentUserRole = 'ROLE_USER';
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('fullName');
  }
}
