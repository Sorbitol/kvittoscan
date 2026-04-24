import { Component, computed, input } from '@angular/core';

type Palette = { bg: string; fg: string };

const PALETTE: Record<string, Palette> = {
  'Groceries':  { bg: '#EDF0E4', fg: '#4E5E3F' },
  'Mat & dryck': { bg: '#EDF0E4', fg: '#4E5E3F' },
  'Health':     { bg: '#EFE6EC', fg: '#6A4F65' },
  'Hälsa':      { bg: '#EFE6EC', fg: '#6A4F65' },
  'Beverages':  { bg: '#E4ECEF', fg: '#3F565E' },
  'Dryck':      { bg: '#E4ECEF', fg: '#3F565E' },
  'Home':       { bg: '#F2ECDF', fg: '#6A573A' },
  'Hem':        { bg: '#F2ECDF', fg: '#6A573A' },
};

@Component({
  selector: 'app-store-mark',
  standalone: true,
  template: `
    <div class="store-mark"
         [style.width.px]="size()"
         [style.height.px]="size()"
         [style.border-radius.px]="size() * 0.3"
         [style.background]="palette().bg"
         [style.color]="palette().fg"
         [style.font-size.px]="size() * 0.5">
      {{ letter() }}
    </div>
  `,
  styles: [`
    .store-mark {
      display: grid;
      place-items: center;
      font-family: 'Instrument Serif', Georgia, serif;
      font-weight: 400;
      letter-spacing: -0.02em;
      font-style: italic;
      flex-shrink: 0;
    }
  `],
})
export class StoreMarkComponent {
  name = input.required<string>();
  size = input<number>(40);
  category = input<string>('');

  palette = computed(() => PALETTE[this.category()] ?? { bg: '#EEECE5', fg: '#3A3A36' });
  letter = computed(() => (this.name() || '?')[0].toUpperCase());
}
