import { Pipe, PipeTransform } from '@angular/core';
import { formatPhone } from '../../core/utils/phone';

/** +77071234567 → +7 (707) 123-45-67 */
@Pipe({ name: 'phone' })
export class PhonePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return formatPhone(value);
  }
}
