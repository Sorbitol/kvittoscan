import { Component, inject, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconComponent, type IconName } from '../icon/icon.component';
import { LangService } from '@core/services/lang.service';

interface Tab {
  id: string;
  icon: IconName;
  sv: string;
  en: string;
  primary?: boolean;
  route: string;
}

const TABS: Tab[] = [
  { id: 'home',     icon: 'home',     sv: 'Hem',      en: 'Home',     route: '/home' },
  { id: 'search',   icon: 'search',   sv: 'Sök',      en: 'Search',   route: '/search' },
  { id: 'scan',     icon: 'camera',   sv: '',         en: '',         route: '/scan', primary: true },
  { id: 'insights', icon: 'chart',    sv: 'Översikt', en: 'Insights', route: '/insights' },
  { id: 'settings', icon: 'settings', sv: 'Konto',    en: 'Account',  route: '/settings' },
];

@Component({
  selector: 'app-tab-bar',
  standalone: true,
  imports: [IconComponent, RouterModule],
  template: `
    <nav class="tab-bar">
      @for (tab of tabs; track tab.id) {
        @if (tab.primary) {
          <button class="tab-bar__scan" (click)="tabSelected.emit(tab.id)" aria-label="Scan">
            <app-icon name="camera" [size]="24" color="#FAFAF7"/>
          </button>
        } @else {
          <button
            class="tab-bar__item"
            [class.tab-bar__item--active]="active() === tab.id"
            (click)="tabSelected.emit(tab.id)"
            [attr.aria-label]="lang.lang() === 'sv' ? tab.sv : tab.en"
            [attr.aria-current]="active() === tab.id ? 'page' : null">
            <app-icon [name]="tab.icon" [size]="22"/>
            <span class="tab-bar__label">{{ lang.lang() === 'sv' ? tab.sv : tab.en }}</span>
          </button>
        }
      }
    </nav>
  `,
  styles: [`
    .tab-bar {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      background: rgba(250,250,247,0.85);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border-top: 1px solid #EDEBE4;
      padding: 10px 8px 28px;
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      z-index: 10;
    }

    .tab-bar__item {
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      padding: 6px 10px;
      color: #8A8F88;
      transition: color 0.15s;

      &--active { color: #0F1110; }
    }

    .tab-bar__label {
      font-size: 10.5px;
      font-weight: 500;
      letter-spacing: 0.01em;
    }

    .tab-bar__scan {
      width: 56px; height: 56px;
      border-radius: 50%;
      background: #0F1110;
      border: none;
      color: #FAFAF7;
      display: grid;
      place-items: center;
      margin-top: -20px;
      cursor: pointer;
      box-shadow: 0 8px 22px rgba(15,17,16,0.25);
      transition: transform 0.15s;

      &:active { transform: scale(0.95); }
    }
  `],
})
export class TabBarComponent {
  protected readonly lang = inject(LangService);
  protected readonly tabs = TABS;

  active = input.required<string>();
  tabSelected = output<string>();
}
