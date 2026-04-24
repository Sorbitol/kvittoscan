import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '@shared/components/icon/icon.component';
import { KrComponent } from '@shared/components/kr/kr.component';
import { StoreMarkComponent } from '@shared/components/store-mark/store-mark.component';
import { LangService } from '@core/services/lang.service';
import type { Receipt } from '@core/models/receipt.model';
import { DEFAULT_CATEGORIES } from '@core/models/category.model';

// Inline seed data for search
const ALL_RECEIPTS: Receipt[] = [
  {
    id: 1, store: 'ICA Maxi', category: 'Mat & dryck', categoryEn: 'Groceries',
    date: '2026-04-22', time: '17:42', total: 847.50, vat: 68.42,
    items: [
      { name: 'Havregryn Kungsörnen 1kg', nameEn: 'Oats Kungsörnen 1kg', qty: 1, price: 24.90, cat: 'Torrvaror' },
      { name: 'Mellanmjölk Arla 1.5L', nameEn: 'Milk Arla 1.5L', qty: 2, price: 19.50, cat: 'Mejeri' },
      { name: 'Bananer ekologiska', nameEn: 'Bananas organic', qty: 1.24, unit: 'kg', price: 28.00, cat: 'Frukt' },
      { name: 'Kaffe Zoégas 450g', nameEn: 'Coffee Zoégas 450g', qty: 1, price: 89.00, cat: 'Dryck' },
      { name: 'Laxfilé 400g', nameEn: 'Salmon fillet 400g', qty: 1, price: 129.00, cat: 'Fisk' },
    ],
  },
  {
    id: 2, store: 'Apotek Hjärtat', category: 'Hälsa', categoryEn: 'Health',
    date: '2026-04-21', time: '12:18', total: 312.00, vat: 37.44,
    items: [
      { name: 'Alvedon 500mg 20st', nameEn: 'Paracetamol 500mg 20ct', qty: 1, price: 39.00, cat: 'Läkemedel' },
      { name: 'D-vitamin Nycoplus', nameEn: 'Vitamin D Nycoplus', qty: 1, price: 149.00, cat: 'Kosttillskott' },
    ],
  },
  {
    id: 7, store: 'Coop', category: 'Mat & dryck', categoryEn: 'Groceries',
    date: '2026-04-10', time: '19:14', total: 512.30, vat: 42.10,
    items: [
      { name: 'Kycklingfilé 900g', nameEn: 'Chicken fillet 900g', qty: 1, price: 109.00, cat: 'Kött' },
      { name: 'Kaffe Zoégas 450g', nameEn: 'Coffee Zoégas 450g', qty: 1, price: 89.00, cat: 'Dryck' },
      { name: 'Bananer ekologiska', nameEn: 'Bananas organic', qty: 1.1, unit: 'kg', price: 28.00, cat: 'Frukt' },
      { name: 'Havregryn Kungsörnen 1kg', nameEn: 'Oats Kungsörnen 1kg', qty: 1, price: 24.90, cat: 'Torrvaror' },
    ],
  },
];

interface GroupedItem {
  name: string;
  occurrences: Array<{ receiptId: number; store: string; date: string; category: string; price: number }>;
  totalSpent: number;
  category: string;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, KrComponent, StoreMarkComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent {
  protected readonly lang = inject(LangService);
  private readonly router = inject(Router);

  query = signal('');
  selectedCategory = signal('all');
  selectedStore = signal('all');
  selectedPeriod = signal('30d');
  showFilters = signal(false);

  categories = DEFAULT_CATEGORIES;
  stores = [...new Set(ALL_RECEIPTS.map(r => r.store))];
  periods = [
    { v: '7d', sv: 'Senaste veckan', en: 'Last week' },
    { v: '30d', sv: 'Senaste 30 dagar', en: 'Last 30 days' },
    { v: '90d', sv: 'Senaste 3 mån', en: 'Last 3 months' },
    { v: 'all', sv: 'Alla', en: 'All time' },
  ];
  suggestions = { sv: ['Kaffe', 'Mjölk', 'Banan', 'Havregryn'], en: ['Coffee', 'Milk', 'Banana', 'Oats'] };

  private allItems = computed(() => {
    const items: Array<{ name: string; nameEn?: string; price: number; qty: number; unit?: string; receiptId: number; store: string; date: string; category: string; categoryEn?: string }> = [];
    ALL_RECEIPTS.forEach(r => {
      r.items.forEach(it => items.push({
        ...it, receiptId: r.id!, store: r.store, date: r.date,
        category: r.category, categoryEn: r.categoryEn,
      }));
    });
    return items;
  });

  groupedItems = computed<GroupedItem[]>(() => {
    const q = this.query().trim().toLowerCase();
    const cat = this.selectedCategory();
    const store = this.selectedStore();
    const lang = this.lang.lang();

    const filtered = this.allItems().filter(it => {
      const nm = (lang === 'sv' ? it.name : (it.nameEn ?? it.name)).toLowerCase();
      if (q && !nm.includes(q)) return false;
      if (cat !== 'all' && it.category !== cat && it.categoryEn !== cat) return false;
      if (store !== 'all' && it.store !== store) return false;
      return true;
    });

    const grouped: Record<string, GroupedItem> = {};
    filtered.forEach(it => {
      const key = lang === 'sv' ? it.name : (it.nameEn ?? it.name);
      if (!grouped[key]) grouped[key] = { name: key, occurrences: [], totalSpent: 0, category: it.category };
      grouped[key].occurrences.push({ receiptId: it.receiptId, store: it.store, date: it.date, category: it.category, price: it.price });
      grouped[key].totalSpent += it.price * (it.unit ? it.qty : 1);
    });

    return Object.values(grouped).sort((a, b) => b.occurrences.length - a.occurrences.length);
  });

  totalItemCount = computed(() => this.allItems().length);

  highlightParts(text: string): Array<{ text: string; highlight: boolean }> {
    const q = this.query().trim();
    if (!q) return [{ text, highlight: false }];
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return [{ text, highlight: false }];
    return [
      { text: text.slice(0, idx), highlight: false },
      { text: text.slice(idx, idx + q.length), highlight: true },
      { text: text.slice(idx + q.length), highlight: false },
    ].filter(p => p.text);
  }

  toggleFilters(): void {
    this.showFilters.update(v => !v);
  }

  goToItem(name: string): void {
    this.router.navigate(['/item'], { queryParams: { name } });
  }
}
