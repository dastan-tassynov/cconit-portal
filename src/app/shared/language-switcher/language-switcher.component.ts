import { ChangeDetectionStrategy, Component, HostListener, inject, input, signal } from '@angular/core';
import { AppLanguage, LanguageService } from '../../core/i18n/language.service';

@Component({
  selector: 'app-language-switcher',
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcherComponent {
  protected readonly language = inject(LanguageService);

  readonly mode = input<'header' | 'floating' | 'inline'>('header');
  protected readonly opened = signal(false);

  protected toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.opened.update(v => !v);
  }

  protected select(lang: AppLanguage): void {
    this.language.use(lang);
    this.opened.set(false);
  }

  @HostListener('document:click')
  protected close(): void {
    this.opened.set(false);
  }
}
