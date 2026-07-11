import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimpleTranslateService } from '../../core/services/translation.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.css']
})
export class LanguageSwitcherComponent {

  opened = false;

  constructor(public translate: SimpleTranslateService) {}

  toggleMenu() {
    this.opened = !this.opened;
  }

  changeLanguage(lang: string) {
    this.translate.use(lang);
    this.opened = false;
  }

  @HostListener('document:click')
  closeMenu() {
    this.opened = false;
  }

  stop(event: MouseEvent) {
    event.stopPropagation();
  }
}
