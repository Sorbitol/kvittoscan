import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-kr',
  standalone: true,
  template: `
    <span class="kr" [style.font-size.px]="size()" [style.color]="muted() ? '#8A8F88' : '#0F1110'">
      {{ whole() }}<span class="frac">,{{ frac() }}</span><span class="unit">kr</span>
    </span>
  `,
  styles: [`
    .kr {
      font-family: 'Instrument Serif', Georgia, serif;
      font-weight: 400;
      letter-spacing: -0.01em;
      font-feature-settings: "tnum";
    }
    .frac {
      font-size: 0.62em;
      opacity: 0.55;
    }
    .unit {
      font-size: 0.55em;
      margin-left: 4px;
      opacity: 0.55;
      font-family: 'Instrument Sans', system-ui, sans-serif;
    }
  `],
})
export class KrComponent {
  v = input.required<number>();
  size = input<number>(16);
  muted = input<boolean>(false);

  private rounded = computed(() => Math.round(this.v() * 100) / 100);
  whole = computed(() => Math.floor(this.rounded()).toLocaleString('sv-SE'));
  frac = computed(() => {
    const fracVal = Math.round((this.rounded() - Math.floor(this.rounded())) * 100);
    return fracVal.toString().padStart(2, '0');
  });
}
