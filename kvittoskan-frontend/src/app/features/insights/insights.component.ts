import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KrComponent } from '@shared/components/kr/kr.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { LangService } from '@core/services/lang.service';

const CATEGORIES = [
  { key: 'groceries', sv: 'Mat & dryck', en: 'Groceries', amount: 3847, color: '#7A8F6A', count: 14 },
  { key: 'home', sv: 'Hem', en: 'Home', amount: 1698, color: '#B9A37A', count: 4 },
  { key: 'health', sv: 'Hälsa', en: 'Health', amount: 524, color: '#8F7A90', count: 3 },
  { key: 'beverages', sv: 'Dryck', en: 'Beverages', amount: 289, color: '#6E8890', count: 1 },
  { key: 'transport', sv: 'Transport', en: 'Transport', amount: 412, color: '#A0826B', count: 2 },
];

const TOP_ITEMS = [
  { sv: 'Kaffe Zoégas 450g', en: 'Coffee Zoégas 450g', count: 4, total: 356 },
  { sv: 'Mellanmjölk Arla 1.5L', en: 'Milk Arla 1.5L', count: 3, total: 58.50 },
  { sv: 'Havregryn Kungsörnen 1kg', en: 'Oats Kungsörnen 1kg', count: 2, total: 49.80 },
  { sv: 'Bananer ekologiska', en: 'Bananas organic', count: 2, total: 64.68 },
];

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule, KrComponent, IconComponent],
  templateUrl: './insights.component.html',
  styleUrl: './insights.component.scss',
})
export class InsightsComponent {
  protected readonly lang = inject(LangService);

  categories = CATEGORIES;
  topItems = TOP_ITEMS;
  viewMode = signal<'month' | 'year'>('month');

  total = CATEGORIES.reduce((s, c) => s + c.amount, 0);

  pct(amount: number): number {
    return Math.round((amount / this.total) * 100);
  }

  catName(cat: typeof CATEGORIES[number]): string {
    return this.lang.lang() === 'sv' ? cat.sv : cat.en;
  }

  itemName(item: typeof TOP_ITEMS[number]): string {
    return this.lang.lang() === 'sv' ? item.sv : item.en;
  }
}
