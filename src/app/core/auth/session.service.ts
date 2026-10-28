import { Injectable, computed, signal } from '@angular/core';
import { AuthResponse, UserRole } from '../api/models';

interface Session {
  token: string;
  username: string;
  fullName: string;
  roles: UserRole[];
}

const STORAGE_KEY = 'session';
/** Ключи старой версии фронтенда — чистим при выходе. */
const LEGACY_KEYS = ['token', 'userRole', 'fullName'];

/**
 * Состояние входа. Роли здесь — только для отображения меню:
 * все права проверяет бэкенд на каждом запросе.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly state = signal<Session | null>(this.restore());

  readonly isLoggedIn = computed(() => this.state() !== null);
  readonly fullName = computed(() => this.state()?.fullName ?? '');
  readonly roles = computed(() => this.state()?.roles ?? []);
  readonly isAdmin = computed(() => this.hasAnyRole('ROLE_ADMIN', 'ROLE_SUPERADMIN'));
  readonly isSuperAdmin = computed(() => this.hasAnyRole('ROLE_SUPERADMIN'));
  readonly primaryRole = computed<UserRole>(() => {
    const roles = this.roles();
    if (roles.includes('ROLE_SUPERADMIN')) return 'ROLE_SUPERADMIN';
    if (roles.includes('ROLE_ADMIN')) return 'ROLE_ADMIN';
    return 'ROLE_USER';
  });

  get token(): string | null {
    return this.state()?.token ?? null;
  }

  hasAnyRole(...roles: UserRole[]): boolean {
    return this.roles().some(role => roles.includes(role));
  }

  start(response: AuthResponse): void {
    const session: Session = {
      token: response.token,
      username: response.username,
      fullName: response.fullName,
      roles: response.roles,
    };
    this.state.set(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  /** После правки анкеты обновляем имя в меню без повторного входа. */
  updateFullName(fullName: string): void {
    const current = this.state();
    if (!current || !fullName) return;
    const next = { ...current, fullName };
    this.state.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  clear(): void {
    this.state.set(null);
    localStorage.removeItem(STORAGE_KEY);
    LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
  }

  private restore(): Session | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as Session;
      return session?.token ? session : null;
    } catch {
      return null;
    }
  }
}
