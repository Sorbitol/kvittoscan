import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, type IconName } from '@shared/components/icon/icon.component';
import { LangService } from '@core/services/lang.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  protected readonly lang = inject(LangService);

  autoCategorize = signal(true);

  members = [
    { initial: 'E', color: '#EDF0E4', fg: '#4E5E3F' },
    { initial: 'M', color: '#F2ECDF', fg: '#6A573A' },
    { initial: 'A', color: '#EFE6EC', fg: '#6A4F65' },
  ];

  preferenceRows: Array<{ icon: IconName; sv: string; en: string; detail?: string; toggle?: boolean }> = [
    { icon: 'bell', sv: 'Notiser', en: 'Notifications', detail: 'Veckosammanfattning' },
    { icon: 'tag', sv: 'Kategorier', en: 'Categories', detail: '5 aktiva' },
    { icon: 'sparkle', sv: 'Automatisk matchning', en: 'Auto-categorize', toggle: true },
  ];

  dataRows: Array<{ icon: IconName; sv: string; en: string; detail?: string }> = [
    { icon: 'export', sv: 'Exportera alla kvitton', en: 'Export all receipts', detail: 'CSV · PDF' },
    { icon: 'receipt', sv: 'Rensa skannade bilder', en: 'Clear scanned images', detail: '284 MB' },
  ];

  aboutRows: Array<{ icon: IconName; sv: string; en: string; detail?: string }> = [
    { icon: 'calendar', sv: 'Språk', en: 'Language', detail: this.lang.lang() === 'sv' ? 'Svenska' : 'English' },
    { icon: 'share', sv: 'Hjälp & support', en: 'Help & support' },
  ];

  toggleLang(): void {
    this.lang.toggle();
    this.aboutRows[0].detail = this.lang.lang() === 'sv' ? 'Svenska' : 'English';
  }
}
