import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FooterComponent } from '../../footer/footer.component';
import {LanguageSwitcherComponent} from '../../language-switcher/language-switcher.component'; // Укажите ваш путь к футеру
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import {SimpleTranslateService} from '../../../core/services/translation.service';
import { PdfViewerModule } from 'ng2-pdf-viewer';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FooterComponent, LanguageSwitcherComponent,TranslatePipe, PdfViewerModule],
  templateUrl: './landing.prava.component.html',
  styleUrls: ['./landing.prava.component.css']
})
export class LandingPravaComponent {
  // Имитация списка проектов
  pdfList = [
    { name: 'Проект образовательных программ для публичного обсуждения («Основы права»)', id: 'osnovy_prava' }, // Используем ID вместо пути
    { name: 'Қоғамдық талқылауға арналған білім беру бағдарламалардың жобасы (Құқық негіздері)', id: 'quqyqtyq_negiz' }, // Используем ID вместо пути
  ];
  selectedPdf: string | null = null;

  constructor(private router: Router,
              public translate: SimpleTranslateService) {}

  goToLogin(): void {
    this.router.navigate(['/auth']);
  }

  openPdf(url: string): void {
    this.selectedPdf = 'https://c49w5cwg79ul.share.zrok.io/api/public/documents/' + url;
  }
  closePdf(): void {
    this.selectedPdf = null; // Кнопка "Закрыть"
  }
}
