import { Pipe, PipeTransform } from '@angular/core';
import { SimpleTranslateService } from '../services/translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Чтобы текст обновлялся сразу при смене языка
})
export class TranslatePipe implements PipeTransform {
  constructor(private translate: SimpleTranslateService) {}

  transform(key: string): string {
    return this.translate.instant(key);
  }
}
