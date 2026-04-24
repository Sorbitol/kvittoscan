import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type IconName =
  | 'home' | 'search' | 'camera' | 'chart' | 'settings'
  | 'back' | 'close' | 'filter' | 'chevron' | 'chevron-down'
  | 'flash' | 'gallery' | 'export' | 'share' | 'check'
  | 'edit' | 'trash' | 'users' | 'bell' | 'receipt'
  | 'tag' | 'calendar' | 'scan-corners' | 'plus' | 'sparkle';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24"
         fill="none" [attr.stroke]="color()" stroke-width="1.5"
         stroke-linecap="round" stroke-linejoin="round">
      @switch (name()) {
        @case ('home') {
          <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-9.5z"/>
        }
        @case ('search') {
          <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
        }
        @case ('camera') {
          <path d="M4 8h3l2-2h6l2 2h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/>
          <circle cx="12" cy="13" r="4"/>
        }
        @case ('chart') {
          <path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>
        }
        @case ('settings') {
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
        }
        @case ('back') {
          <path d="M15 5l-7 7 7 7"/>
        }
        @case ('close') {
          <path d="M6 6l12 12M6 18L18 6"/>
        }
        @case ('filter') {
          <path d="M3 5h18M6 12h12M10 19h4"/>
        }
        @case ('chevron') {
          <path d="M9 6l6 6-6 6"/>
        }
        @case ('chevron-down') {
          <path d="M6 9l6 6 6-6"/>
        }
        @case ('flash') {
          <path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z"/>
        }
        @case ('gallery') {
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="9" cy="9" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        }
        @case ('export') {
          <path d="M12 3v12M7 8l5-5 5 5M5 21h14"/>
        }
        @case ('share') {
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/>
        }
        @case ('check') {
          <path d="M4 12l5 5L20 6"/>
        }
        @case ('edit') {
          <path d="M4 20h4L19 9l-4-4L4 16v4z"/>
        }
        @case ('trash') {
          <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>
        }
        @case ('users') {
          <circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.5"/>
          <path d="M3 20c0-3 3-5 6-5s6 2 6 5M15 20c0-2 2-4 4-4s2 1 2 2"/>
        }
        @case ('bell') {
          <path d="M18 16V11a6 6 0 10-12 0v5l-2 3h16l-2-3zM10 21a2 2 0 004 0"/>
        }
        @case ('receipt') {
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/>
          <path d="M9 8h6M9 12h6M9 16h4"/>
        }
        @case ('tag') {
          <path d="M3 12V3h9l9 9-9 9-9-9z"/>
          <circle cx="7.5" cy="7.5" r="1.2" [attr.fill]="color()"/>
        }
        @case ('calendar') {
          <rect x="3" y="5" width="18" height="16" rx="2"/>
          <path d="M3 10h18M8 3v4M16 3v4"/>
        }
        @case ('scan-corners') {
          <path d="M4 9V5a1 1 0 011-1h4M15 4h4a1 1 0 011 1v4M20 15v4a1 1 0 01-1 1h-4M9 20H5a1 1 0 01-1-1v-4"/>
        }
        @case ('plus') {
          <path d="M12 4v16M4 12h16"/>
        }
        @case ('sparkle') {
          <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/>
        }
      }
    </svg>
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; justify-content: center; }
    svg { display: block; }
  `],
})
export class IconComponent {
  name = input.required<IconName>();
  size = input<number>(22);
  color = input<string>('currentColor');
}
