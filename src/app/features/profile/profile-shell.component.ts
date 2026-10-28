import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { interval } from 'rxjs';
import { UnreadNotificationsService } from '../../core/account/unread-notifications.service';
import { AuthApiService } from '../../core/api/auth-api.service';
import { SessionService } from '../../core/auth/session.service';
import { LanguageService } from '../../core/i18n/language.service';

interface MenuItem {
  path: string;
  key: string;
  icon: string;
}

const UNREAD_POLL_MS = 60_000;
const COLLAPSED_KEY = 'cabinet.sidebar.collapsed';

/**
 * Оболочка личного кабинета (структура как у kcppk-bilimzet.kz):
 * сворачиваемое меню слева, виджет проверки сертификата, карточка пользователя;
 * сверху — языки и колокольчик уведомлений.
 */
@Component({
  selector: 'app-profile-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule, TranslatePipe],
  templateUrl: './profile-shell.component.html',
  styleUrl: './profile-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileShellComponent implements OnInit {
  protected readonly session = inject(SessionService);
  protected readonly language = inject(LanguageService);
  protected readonly unread = inject(UnreadNotificationsService);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly collapsed = signal(this.restoreCollapsed());
  protected readonly mobileOpen = signal(false);
  protected certificateCode = '';

  protected readonly studentMenu: MenuItem[] = [
    { path: 'home', key: 'CAB_MENU_HOME', icon: '🏠' },
    { path: 'courses', key: 'CAB_MENU_COURSES', icon: '📂' },
    { path: 'certificates', key: 'CAB_MENU_CERTIFICATES', icon: '🏅' },
    { path: 'contests', key: 'CAB_MENU_CONTESTS', icon: '🏆' },
    { path: 'survey', key: 'CAB_MENU_SURVEY', icon: '📝' },
    { path: 'workgroups', key: 'CAB_MENU_WORKGROUPS', icon: '👥' },
    { path: 'lecturer', key: 'CAB_MENU_LECTURER', icon: '🎓' },
    { path: 'notifications', key: 'CAB_MENU_NOTIFICATIONS', icon: '🔔' },
    { path: 'account', key: 'CAB_MENU_ACCOUNT', icon: '👤' },
  ];

  protected readonly adminMenu: MenuItem[] = [
    { path: 'constructor', key: 'MENU_CONSTRUCTOR', icon: '🛠' },
    { path: 'catalog', key: 'CAB_MENU_CATALOG', icon: '🗂' },
    { path: 'translations', key: 'MENU_TRANSLATIONS', icon: '🌐' },
    { path: 'content', key: 'CAB_MENU_CONTENT', icon: '📰' },
    { path: 'applications', key: 'CAB_MENU_APPLICATIONS', icon: '📋' },
    { path: 'support', key: 'CAB_MENU_SUPPORT', icon: '🧑‍💼' },
    { path: 'contests-admin', key: 'CAB_MENU_CONTESTS_ADMIN', icon: '🏆' },
    { path: 'requests', key: 'MENU_CONTACT_REQUESTS', icon: '📨' },
    { path: 'ads', key: 'MENU_ADS', icon: '📢' },
  ];

  ngOnInit(): void {
    this.unread.refresh();
    interval(UNREAD_POLL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.unread.refresh());
  }

  protected toggleCollapsed(): void {
    this.collapsed.update(v => !v);
    try {
      localStorage.setItem(COLLAPSED_KEY, String(this.collapsed()));
    } catch {
      /* без сохранения */
    }
  }

  protected verifyCertificate(): void {
    const code = this.certificateCode.trim();
    if (code) {
      this.router.navigate(['/verify/certificate', code]);
    }
  }

  protected initials(): string {
    const name = this.session.fullName().trim();
    return name ? name[0].toUpperCase() : '?';
  }

  protected logout(): void {
    this.authApi.logout();
    this.router.navigate(['/']);
  }

  private restoreCollapsed(): boolean {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  }
}
