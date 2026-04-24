import { Component, input, output } from '@angular/core';
import { IconComponent, type IconName } from '../icon/icon.component';

export type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'accent';
export type BtnSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-btn',
  standalone: true,
  imports: [IconComponent],
  template: `
    <button
      class="btn btn--{{ variant() }} btn--{{ size() }}"
      [disabled]="disabled()"
      [type]="type()"
      (click)="clicked.emit($event)">
      @if (icon()) {
        <app-icon [name]="icon()!" [size]="16"/>
      }
      <ng-content/>
    </button>
  `,
  styles: [`
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-radius: 999px;
      font-family: 'Instrument Sans', system-ui, sans-serif;
      font-weight: 500;
      letter-spacing: -0.005em;
      cursor: pointer;
      transition: opacity 0.15s;
      white-space: nowrap;

      &:active { opacity: 0.75; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .btn--sm  { padding: 8px 14px; font-size: 13px; }
    .btn--md  { padding: 12px 18px; font-size: 14px; }
    .btn--lg  { padding: 16px 22px; font-size: 15px; }

    .btn--primary   { background: #0F1110; color: #FAFAF7; border: 1px solid #0F1110; }
    .btn--secondary { background: #FFFFFF; color: #0F1110; border: 1px solid #E0DED6; }
    .btn--ghost     { background: transparent; color: #0F1110; border: 1px solid transparent; }
    .btn--accent    { background: #4E5E3F; color: #FAFAF7; border: 1px solid #4E5E3F; }
  `],
})
export class BtnComponent {
  variant = input<BtnVariant>('primary');
  size = input<BtnSize>('md');
  icon = input<IconName | undefined>(undefined);
  disabled = input<boolean>(false);
  type = input<'button' | 'submit' | 'reset'>('button');
  clicked = output<MouseEvent>();
}
