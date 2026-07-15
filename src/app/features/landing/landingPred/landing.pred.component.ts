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
  templateUrl: './landing.pred.component.html',
  styleUrls: ['./landing.pred.component.css']
})
export class LandingPredComponent {
  // Имитация списка проектов
  pdfList = [
    { name: 'Қоғамдық талқылауға арналған білім беру бағдарламалардың жобасы (Мектепалды даярлық)', id: 'mektep_aldy_kaz' }, // Используем ID вместо пути
    { name: 'Проект образовательных программ для публичного обсуждения (для педагогов предшкольных классов)', id: 'pred_shkola' }
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
