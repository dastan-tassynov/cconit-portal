import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';

/**
 * «Защита» контента от копирования: блокирует контекстное меню, горячие клавиши
 * сохранения/печати/DevTools и размывает страницу, когда вкладка теряет фокус.
 * <p>
 * ВАЖНО: это лишь затрудняет копирование для обычного пользователя. Скриншот телефоном,
 * запись экрана или DevTools это не остановит — реальная защита платного контента
 * сделана на бэкенде (доступ по оплате, подписанные ссылки на видео).
 */
@Injectable({ providedIn: 'root' })
export class ContentProtectionService {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private enabled = false;

  enable(): void {
    if (this.enabled) return;
    this.enabled = true;

    const win = this.document.defaultView;
    if (!win) return;

    const preventContextMenu = (event: Event) => event.preventDefault();
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const devTools = event.ctrlKey && event.shiftKey && (key === 'i' || key === 'j' || key === 'c');
      const saveOrPrint = (event.ctrlKey || event.metaKey) && (key === 's' || key === 'p');
      if (devTools || saveOrPrint || event.key === 'F12') {
        event.preventDefault();
      }
    };
    const blur = () => this.setBlur(true);
    const unblur = () => this.setBlur(false);
    const onVisibility = () => this.setBlur(this.document.hidden);

    this.document.addEventListener('contextmenu', preventContextMenu);
    this.document.addEventListener('visibilitychange', onVisibility);
    win.addEventListener('keydown', onKeyDown);
    win.addEventListener('blur', blur);
    win.addEventListener('focus', unblur);

    this.destroyRef.onDestroy(() => {
      this.document.removeEventListener('contextmenu', preventContextMenu);
      this.document.removeEventListener('visibilitychange', onVisibility);
      win.removeEventListener('keydown', onKeyDown);
      win.removeEventListener('blur', blur);
      win.removeEventListener('focus', unblur);
    });
  }

  private setBlur(on: boolean): void {
    this.document.body.classList.toggle('content-hidden', on);
  }
}
