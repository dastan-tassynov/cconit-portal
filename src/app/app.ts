import {Component, HostListener, OnInit, signal} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SimpleTranslateService } from './core/services/translation.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit{
  constructor(private translate: SimpleTranslateService) {}
  protected readonly title = signal('web-portal2');
  ngOnInit(): void {
    this.translate.use('ru');
    // Блокировка правой кнопки мыши
    document.addEventListener('contextmenu', (event) => event.preventDefault());

    // ЗАЩИТА ДЛЯ ТЕЛЕФОНОВ: Отслеживаем потерю фокуса вкладки/мобильного браузера
    document.addEventListener('visibilitychange', () => {
      const container = document.querySelector('body');
      if (document.hidden) {
        // Если вкладку скрыли, свернули или вызвали системное меню скриншота
        if (container) container.style.filter = 'blur(40px)'; // Жестко размываем абсолютно весь контент
      } else {
        // Когда пользователь вернулся
        if (container) container.style.filter = 'none';
      }
    });
  }

  // Настольный перехват клавиш
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'F11' ||
      (event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'J' || event.key === 'i' || event.key === 'j')) ||
      (event.ctrlKey && (event.key === 'S' || event.key === 's' || event.key === 'P' || event.key === 'p'))) {
      event.preventDefault();
    }

    if (event.key === 'PrintScreen') {
      navigator.clipboard.writeText('');
      alert('Скриншоты запрещены политикой безопасности ЦОНИТ!');
    }
  }

  // Если открывается шторка уведомлений/записи на мобильном
  @HostListener('window:blur')
  onWindowBlur(): void {
    const container = document.querySelector('body');
    if (container) container.style.filter = 'blur(40px)';
  }

  @HostListener('window:focus')
  onWindowFocus(): void {
    const container = document.querySelector('body');
    if (container) container.style.filter = 'none';
  }
}
