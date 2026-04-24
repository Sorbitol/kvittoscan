import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'scan',
    canActivate: [authGuard],
    loadComponent: () => import('./features/scan/scan.component').then(m => m.ScanComponent),
  },
  {
    path: 'processing',
    canActivate: [authGuard],
    loadComponent: () => import('./features/processing/processing.component').then(m => m.ProcessingComponent),
  },
  {
    path: 'receipt/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/receipt-detail/receipt-detail.component').then(m => m.ReceiptDetailComponent),
  },
  {
    path: 'search',
    canActivate: [authGuard],
    loadComponent: () => import('./features/search/search.component').then(m => m.SearchComponent),
  },
  {
    path: 'item',
    canActivate: [authGuard],
    loadComponent: () => import('./features/item-detail/item-detail.component').then(m => m.ItemDetailComponent),
  },
  {
    path: 'insights',
    canActivate: [authGuard],
    loadComponent: () => import('./features/insights/insights.component').then(m => m.InsightsComponent),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
  },
  { path: '**', redirectTo: 'home' },
];
