import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '@shared/components/icon/icon.component';
import { KrComponent } from '@shared/components/kr/kr.component';
import { BtnComponent } from '@shared/components/btn/btn.component';
import { StoreMarkComponent } from '@shared/components/store-mark/store-mark.component';
import { LangService } from '@core/services/lang.service';
import { OcrService } from '@core/services/ocr.service';
import { ReceiptService } from '@core/services/receipt.service';
import type { OcrItem } from '@core/models/receipt.model';

type Step = { sv: string; en: string };

const STEPS: Step[] = [
  { sv: 'Analyserar bild', en: 'Analyzing image' },
  { sv: 'Läser text (OCR)', en: 'Reading text (OCR)' },
  { sv: 'Identifierar varor', en: 'Identifying items' },
  { sv: 'Matchar kategori', en: 'Matching category' },
];

// Demo OCR data matching the prototype
const DEMO_ITEMS: OcrItem[] = [
  { name: 'HAVREGRYN KUNGSÖRN', price: 24.90, confidence: 0.98 },
  { name: 'MELLANMJÖLK 1.5L', price: 39.00, confidence: 0.99 },
  { name: 'BANANER EKO', price: 34.72, confidence: 0.94 },
  { name: 'KAFFE ZOÉGAS 450G', price: 89.00, confidence: 0.97 },
  { name: 'LAXFILÉ 400G', price: 129.00, confidence: 0.99 },
  { name: 'AVOKADO 3ST', price: 41.70, confidence: 0.92 },
];

const CATEGORIES = ['Mat & dryck', 'Hem', 'Hälsa', 'Transport'];
const CATEGORIES_EN = ['Groceries', 'Home', 'Health', 'Transport'];

@Component({
  selector: 'app-processing',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, KrComponent, BtnComponent, StoreMarkComponent],
  templateUrl: './processing.component.html',
  styleUrl: './processing.component.scss',
})
export class ProcessingComponent implements OnInit {
  protected readonly lang = inject(LangService);
  private readonly router = inject(Router);
  private readonly ocrService = inject(OcrService);
  private readonly receiptService = inject(ReceiptService);

  step = signal(0);
  reviewMode = signal(false);
  items = signal<OcrItem[]>(DEMO_ITEMS);
  selectedCategory = signal(0);
  steps = STEPS;
  categories = CATEGORIES;
  categoriesEn = CATEGORIES_EN;

  total = computed(() => this.items().reduce((s, i) => s + i.price, 0));

  ngOnInit(): void {
    this.runSteps();
  }

  private runSteps(): void {
    const advance = () => {
      const current = this.step();
      if (current < STEPS.length - 1) {
        this.step.set(current + 1);
        setTimeout(advance, 700);
      } else {
        setTimeout(() => this.reviewMode.set(true), 700);
      }
    };
    setTimeout(advance, 700);
  }

  isStepDone(i: number): boolean {
    return i < this.step();
  }

  isStepActive(i: number): boolean {
    return i === this.step() && !this.reviewMode();
  }

  updateItemPrice(index: number, newPrice: number): void {
    this.items.update(items => items.map((it, i) => i === index ? { ...it, price: newPrice } : it));
  }

  updateItemName(index: number, newName: string): void {
    this.items.update(items => items.map((it, i) => i === index ? { ...it, name: newName } : it));
  }

  async saveReceipt(): Promise<void> {
    const category = this.lang.lang() === 'sv'
      ? CATEGORIES[this.selectedCategory()]
      : CATEGORIES_EN[this.selectedCategory()];

    await this.receiptService.saveReceipt({
      store: 'ICA Maxi', storeShort: 'ICA',
      category: CATEGORIES[this.selectedCategory()],
      categoryEn: CATEGORIES_EN[this.selectedCategory()],
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      total: this.total(),
      vat: this.total() * 0.12,
      items: this.items().map(it => ({
        name: it.name, qty: 1, price: it.price, cat: category,
      })),
    });

    this.router.navigate(['/home']);
  }

  cancel(): void {
    this.router.navigate(['/scan']);
  }
}
