import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SessionService } from '../../core/auth/session.service';
import { LanguageService } from '../../core/i18n/language.service';

/**
 * Шапка публичного сайта (структура как у kcppk-bilimzet.kz):
 * верхняя полоса (телефон, промо, языки) → логотип, поиск, вход, бургер-меню на всю ширину.
 */
@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeaderComponent {
  protected readonly session = inject(SessionService);
  protected readonly language = inject(LanguageService);
  protected readonly menuOpen = signal(false);

  protected readonly phone = '+7 (707) 713 11 31';
  protected readonly phoneHref = 'tel:+77077131131';

  /** Пункты меню как у образца. fragment — якорь на главной. */
  protected readonly links: { path: string; fragment?: string; key: string }[] = [
    { path: '/courses', key: 'SITE_NAV_COURSES' },
    { path: '/contests', key: 'SITE_NAV_CONTESTS' },
    { path: '/news', key: 'SITE_NAV_NEWS' },
    { path: '/about', key: 'SITE_NAV_ABOUT' },
    { path: '/', fragment: 'contacts', key: 'SITE_NAV_CONTACTS' },
    { path: '/profile/workgroups', key: 'CAB_MENU_WORKGROUPS' },
    { path: '/faq', key: 'FAQ_GUIDE' },
  ];
}
