import { Component, input } from '@angular/core';
import { IconComponent, type IconName } from '../icon/icon.component';

@Component({
  selector: 'app-chip',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="chip">
      @if (icon()) {
        <app-icon [name]="icon()!" [size]="13" color="#6B6F6A"/>
      }
      <ng-content/>
    </div>
  `,
  styles: [`
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      border-radius: 999px;
      background: #FFFFFF;
      border: 1px solid #E8E6DF;
      font-size: 11.5px;
      color: #4A4E48;
      font-weight: 500;
      white-space: nowrap;
    }
  `],
})
export class ChipComponent {
  icon = input<IconName | undefined>(undefined);
}
