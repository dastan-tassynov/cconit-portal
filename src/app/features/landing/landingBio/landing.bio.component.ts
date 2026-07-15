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
  templateUrl: './landing.bio.component.html',
  styleUrls: ['./landing.bio.component.css']
})
export class LandingBioComponent {
  // Имитация списка проектов
  pdfList = [
    { name: '«Биология пәнін оқытудың заманауи әдістері: жасанды интеллект технологияларын пайдалану» атты педагогтардың біліктілігін арттыру курстарының БІЛІМ БЕРУ БАҒДАРЛАМАСЫ', id: 'bio_kz' }, // Используем ID вместо пути
    { name: 'ОБРАЗОВАТЕЛЬНАЯ ПРОГРАММА курсов повышения квалификации для педагогов «Современные методы обучения биологии: использование технологий искусственного интеллекта»', id: 'bio_ru' }
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
