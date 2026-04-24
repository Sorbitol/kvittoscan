import { Pipe, PipeTransform, inject } from '@angular/core';
import { LangService } from '@core/services/lang.service';

const SV_MONTHS = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];
const EN_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

@Pipe({ name: 'formatDate', standalone: true, pure: false })
export class FormatDatePipe implements PipeTransform {
  private lang = inject(LangService);

  transform(iso: string): string {
    const d = new Date(iso);
    const months = this.lang.lang() === 'sv' ? SV_MONTHS : EN_MONTHS;
    return `${d.getDate()} ${months[d.getMonth()]}`;
  }
}
