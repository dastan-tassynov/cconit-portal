import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { SiteHeaderComponent } from '../../../shared/site-header/site-header.component';

/** «О центре», контакты и полезные ссылки — тексты из раздела «Полезная информация» Telegram-бота. */
@Component({
  selector: 'app-about',
  imports: [RouterLink, TranslatePipe, SiteHeaderComponent, FooterComponent],
  styleUrl: '../page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-site-header />
    <main class="container">
      <nav class="crumbs">
        <a routerLink="/">{{ 'CRUMB_HOME' | translate }}</a> <span>›</span>
        <span class="crumbs__current">{{ 'SITE_ABOUT_TITLE' | translate }}</span>
      </nav>
      <h1 class="page-title">{{ 'ABOUT_ORG_NAME' | translate }}</h1>

      <div class="section about">
        <section class="about__main">
          <p class="about__text">{{ 'ABOUT_TEXT' | translate }}</p>

          <h2>{{ 'ABOUT_DIRECTIONS_TITLE' | translate }}</h2>
          <ul class="chips">
            @for (key of directions; track key) { <li>{{ key | translate }}</li> }
          </ul>

          <h2>{{ 'ABOUT_PROJECTS_TITLE' | translate }}</h2>
          <ul class="list">
            @for (key of projects; track key) { <li>{{ key | translate }}</li> }
          </ul>
        </section>

        <aside class="about__side">
          <div class="box">
            <h3>{{ 'SITE_NAV_CONTACTS' | translate }}</h3>
            <p>📍 {{ 'FOOTER_ADDRESS' | translate }}</p>
            <p>📞 <a href="tel:+77013892833">+7 701 389 28 33</a><br>📞 <a href="tel:+77077131131">+7 707 713 11 31</a></p>
            <p>📧 <a href="mailto:centr-bilim@list.ru">centr-bilim&#64;list.ru</a></p>
            <p class="socials">
              <a href="https://t.me/centernit" target="_blank" rel="noopener noreferrer">Telegram</a>
              <a href="https://www.instagram.com/centr.bilim/" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href="https://t.me/CONITkz_bot" target="_blank" rel="noopener noreferrer">{{ 'ABOUT_BOT' | translate }}</a>
            </p>
          </div>
          <div class="box">
            <h3>{{ 'ABOUT_LINKS_TITLE' | translate }}</h3>
            <ul class="links">
              @for (link of links; track link.url) {
                <li><a [href]="link.url" target="_blank" rel="noopener noreferrer">{{ link.key | translate }}</a></li>
              }
            </ul>
          </div>
        </aside>
      </div>
    </main>
    <app-footer />
  `,
  styles: `
    .about { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 32px; align-items: start; }
    .about__text { white-space: pre-line; line-height: 1.7; color: #3f3f50; margin-top: 0; }
    .about h2 { font-size: 20px; margin: 28px 0 12px; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; padding: 0; margin: 0; }
    .chips li { background: var(--lavender); color: var(--primary); padding: 8px 14px; border-radius: 999px; font-weight: 600; font-size: 14px; }
    .list { line-height: 1.7; color: #3f3f50; padding-left: 20px; }
    .about__side { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 96px; }
    .box { border: 1px solid var(--line); border-radius: 16px; padding: 20px; background: #fff; }
    .box h3 { margin: 0 0 12px; }
    .box p { margin: 0 0 10px; line-height: 1.6; }
    .box a { color: var(--primary); text-decoration: none; }
    .socials { display: flex; gap: 14px; flex-wrap: wrap; }
    .links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
    @media (max-width: 900px) { .about { grid-template-columns: 1fr; } .about__side { position: static; } }
  `,
})
export class AboutComponent {
  protected readonly directions = ['ABOUT_DIR_1', 'ABOUT_DIR_2', 'ABOUT_DIR_3', 'ABOUT_DIR_4', 'ABOUT_DIR_5'];
  protected readonly projects = ['ABOUT_PROJ_1', 'ABOUT_PROJ_2', 'ABOUT_PROJ_3', 'ABOUT_PROJ_4', 'ABOUT_PROJ_5', 'ABOUT_PROJ_6', 'ABOUT_PROJ_7'];
  protected readonly links = [
    { key: 'LINK_AKORDA', url: 'https://www.akorda.kz/kz' },
    { key: 'LINK_EDU_MINISTRY', url: 'https://www.gov.kz/memleket/entities/edu' },
    { key: 'LINK_ALMATY', url: 'http://www.almaty.gov.kz/' },
    { key: 'LINK_STRATEGY', url: 'https://strategy2050.kz/ru/' },
    { key: 'LINK_SYMBOLS', url: 'http://www.akorda.kz/kz/state_symbols/about_state_symbols' },
  ];
}
