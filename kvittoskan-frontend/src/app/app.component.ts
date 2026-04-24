import { Component, inject, computed } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { TabBarComponent } from './shared/components/tab-bar/tab-bar.component';

const FULL_SCREEN_ROUTES = new Set(['/scan', '/processing', '/auth']);

const TAB_ROUTES: Record<string, string> = {
  home: '/home',
  search: '/search',
  scan: '/scan',
  insights: '/insights',
  settings: '/settings',
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, TabBarComponent],
  template: `
    <div class="app-shell">
      <main class="app-shell__content" [class.app-shell__content--full]="isFullScreen()">
        <router-outlet/>
      </main>

      @if (!isFullScreen()) {
        <app-tab-bar [active]="activeTab()" (tabSelected)="onTabSelect($event)"/>
      }
    </div>
  `,
  styles: [`
    .app-shell {
      position: relative;
      width: 100%;
      height: 100%;
      background: #FAFAF7;
      overflow: hidden;
    }

    .app-shell__content {
      position: absolute;
      inset: 0;
      bottom: 83px;
      overflow-y: auto;
      overflow-x: hidden;

      &--full {
        bottom: 0;
      }
    }
  `],
})
export class AppComponent {
  private readonly router = inject(Router);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  isFullScreen = computed(() => {
    const url = this.currentUrl();
    return FULL_SCREEN_ROUTES.has(url)
      || url.startsWith('/scan')
      || url.startsWith('/processing')
      || url.startsWith('/auth');
  });

  activeTab = computed(() => {
    const url = this.currentUrl();
    if (url.startsWith('/home') || url.startsWith('/receipt')) return 'home';
    if (url.startsWith('/search') || url.startsWith('/item')) return 'search';
    if (url.startsWith('/insights')) return 'insights';
    if (url.startsWith('/settings')) return 'settings';
    return 'home';
  });

  onTabSelect(tabId: string): void {
    const route = TAB_ROUTES[tabId];
    if (route) this.router.navigate([route]);
  }
}
