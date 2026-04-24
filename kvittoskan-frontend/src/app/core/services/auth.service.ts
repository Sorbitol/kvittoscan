import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { User, AuthResponse, LoginRequest, RegisterRequest } from '../models/user.model';
import { environment } from '@env/environment';

const TOKEN_KEY = 'kvittoskan_token';
const USER_KEY = 'kvittoskan_user';
const EXPIRES_KEY = 'kvittoskan_token_expires';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  currentUser = signal<User | null>(this.loadStoredUser());
  isAuthenticated = signal<boolean>(this.hasValidToken());

  async login(req: LoginRequest): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, req)
    );
    this.storeAuth(res);
  }

  async register(req: RegisterRequest): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, req)
    );
    this.storeAuth(res);
  }

  async refreshCurrentUser(): Promise<void> {
    try {
      const user = await firstValueFrom(
        this.http.get<User>(`${environment.apiUrl}/auth/me`)
      );
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      this.currentUser.set(user);
    } catch {
      await this.logout();
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    await this.router.navigate(['/auth']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private storeAuth(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(EXPIRES_KEY, res.expiresAt);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.currentUser.set(res.user);
    this.isAuthenticated.set(true);
  }

  private loadStoredUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private hasValidToken(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    const expiresAt = localStorage.getItem(EXPIRES_KEY);
    if (!expiresAt) return true;
    return new Date(expiresAt).getTime() > Date.now();
  }
}
