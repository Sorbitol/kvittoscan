import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KrComponent } from '@shared/components/kr/kr.component';
import { StoreMarkComponent } from '@shared/components/store-mark/store-mark.component';
import { FormatDatePipe } from '@shared/pipes/format-date.pipe';
import { LangService } from '@core/services/lang.service';
import { ReceiptService } from '@core/services/receipt.service';
import type { Receipt } from '@core/models/receipt.model';
import { DEFAULT_CATEGORIES, type Category, type WeeklyStat } from '@core/models/category.model';

// Seed data matching the design prototype
const SEED_RECEIPTS: Receipt[] = [
  {
    id: 1, store: 'ICA Maxi', storeShort: 'ICA', category: 'Mat & dryck', categoryEn: 'Groceries',
    date: '2026-04-22', time: '17:42', total: 847.50, vat: 68.42, payment: 'Mastercard •• 4471',
    items: [
      { name: 'Havregryn Kungsörnen 1kg', nameEn: 'Oats Kungsörnen 1kg', qty: 1, price: 24.90, cat: 'Torrvaror' },
      { name: 'Mellanmjölk Arla 1.5L', nameEn: 'Milk Arla 1.5L', qty: 2, price: 19.50, cat: 'Mejeri' },
      { name: 'Bananer ekologiska', nameEn: 'Bananas organic', qty: 1.24, unit: 'kg', price: 28.00, cat: 'Frukt' },
      { name: 'Kaffe Zoégas 450g', nameEn: 'Coffee Zoégas 450g', qty: 1, price: 89.00, cat: 'Dryck' },
      { name: 'Laxfilé 400g', nameEn: 'Salmon fillet 400g', qty: 1, price: 129.00, cat: 'Fisk' },
    ],
  },
  {
    id: 2, store: 'Apotek Hjärtat', storeShort: 'Apotek', category: 'Hälsa', categoryEn: 'Health',
    date: '2026-04-21', time: '12:18', total: 312.00, vat: 37.44, payment: 'Apple Pay',
    items: [
      { name: 'Alvedon 500mg 20st', nameEn: 'Paracetamol 500mg 20ct', qty: 1, price: 39.00, cat: 'Läkemedel' },
      { name: 'D-vitamin Nycoplus', nameEn: 'Vitamin D Nycoplus', qty: 1, price: 149.00, cat: 'Kosttillskott' },
    ],
  },
  {
    id: 3, store: 'Systembolaget', storeShort: 'System', category: 'Dryck', categoryEn: 'Beverages',
    date: '2026-04-19', time: '18:56', total: 289.00, vat: 57.80, payment: 'Mastercard •• 4471',
    items: [
      { name: 'Rödvin Barolo 2020', nameEn: 'Red wine Barolo 2020', qty: 1, price: 189.00, cat: 'Vin' },
      { name: 'Mineralvatten Ramlösa', nameEn: 'Mineral water Ramlösa', qty: 4, price: 12.50, cat: 'Vatten' },
    ],
  },
  {
    id: 4, store: 'IKEA Kungens Kurva', storeShort: 'IKEA', category: 'Hem', categoryEn: 'Home',
    date: '2026-04-17', time: '14:03', total: 1249.00, vat: 249.80, payment: 'Mastercard •• 4471',
    items: [
      { name: 'BILLY Bokhylla 80x28x202', nameEn: 'BILLY Bookshelf', qty: 1, price: 799.00, cat: 'Möbler' },
    ],
  },
];

const WEEKLY_STATS: WeeklyStat[] = [
  { week: 'v9', amount: 1240 }, { week: 'v10', amount: 890 }, { week: 'v11', amount: 1640 },
  { week: 'v12', amount: 1120 }, { week: 'v13', amount: 2180 }, { week: 'v14', amount: 980 },
  { week: 'v15', amount: 1340 }, { week: 'v16', amount: 1780 }, { week: 'v17', amount: 1450 },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, KrComponent, StoreMarkComponent, FormatDatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  protected readonly lang = inject(LangService);
  private readonly receiptService = inject(ReceiptService);
  private readonly router = inject(Router);

  receipts = signal<Receipt[]>(SEED_RECEIPTS);
  recentReceipts = computed(() => this.receipts().slice(0, 4));
  totalMonth = 6024;
  weeklyStats = WEEKLY_STATS;
  maxWeekly = Math.max(...WEEKLY_STATS.map(w => w.amount));
  categories = DEFAULT_CATEGORIES.map((c, i) => ({
    ...c,
    amount: [3847, 1698, 524, 289, 412][i] ?? 0,
    count: [14, 4, 3, 1, 2][i] ?? 0,
  }));

  async ngOnInit(): Promise<void> {
    await this.receiptService.loadAll();
    this.receiptService.receipts$.subscribe(r => {
      if (r.length) this.receipts.set(r);
    });
  }

  barHeight(amount: number): number {
    return (amount / this.maxWeekly) * 44;
  }

  goToReceipt(id: number): void {
    this.router.navigate(['/receipt', id]);
  }

  goToSearch(): void {
    this.router.navigate(['/search']);
  }

  greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return this.lang.t('God morgon', 'Good morning');
    if (h < 17) return this.lang.t('God eftermiddag', 'Good afternoon');
    return this.lang.t('God kväll', 'Good evening');
  }

  todayLabel(): string {
    return this.lang.t('Tisdag 22 April', 'Tuesday 22 April');
  }
}
