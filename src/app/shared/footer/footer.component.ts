import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  protected readonly year = new Date().getFullYear();
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
