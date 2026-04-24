import { Injectable, signal } from '@angular/core';

export type Lang = 'sv' | 'en';

@Injectable({ providedIn: 'root' })
export class LangService {
  lang = signal<Lang>((localStorage.getItem('kvittoskan_lang') as Lang) || 'sv');

  toggle(): void {
    this.set(this.lang() === 'sv' ? 'en' : 'sv');
  }

  set(lang: Lang): void {
    this.lang.set(lang);
    localStorage.setItem('kvittoskan_lang', lang);
  }

  t(sv: string, en: string): string {
    return this.lang() === 'sv' ? sv : en;
  }
}
