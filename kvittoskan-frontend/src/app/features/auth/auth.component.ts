import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { IconComponent } from '@shared/components/icon/icon.component';
import { LangService } from '@core/services/lang.service';
import { AuthService } from '@core/services/auth.service';

type Mode = 'login' | 'register';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent {
  protected readonly lang = inject(LangService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  mode = signal<Mode>('login');
  email = signal('');
  password = signal('');
  displayName = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  isLogin = computed(() => this.mode() === 'login');

  canSubmit = computed(() => {
    const e = this.email().trim();
    const p = this.password();
    if (!e || !p) return false;
    if (p.length < 8) return false;
    if (!this.isLogin() && !this.displayName().trim()) return false;
    return !this.loading();
  });

  setMode(m: Mode): void {
    this.mode.set(m);
    this.error.set(null);
  }

  toggleLang(): void {
    this.lang.toggle();
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;
    this.loading.set(true);
    this.error.set(null);

    try {
      if (this.isLogin()) {
        await this.auth.login({
          email: this.email().trim(),
          password: this.password(),
        });
      } else {
        await this.auth.register({
          email: this.email().trim(),
          password: this.password(),
          displayName: this.displayName().trim(),
        });
      }
      await this.router.navigate(['/home']);
    } catch (err) {
      this.error.set(this.describeError(err));
    } finally {
      this.loading.set(false);
    }
  }

  private describeError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 401) return this.lang.t('Fel e-post eller lösenord', 'Invalid email or password');
      if (err.status === 409) return this.lang.t('E-posten är redan registrerad', 'Email is already registered');
      if (err.status === 400 && err.error?.error) return err.error.error;
      if (err.status === 0) return this.lang.t('Kan inte nå servern', 'Cannot reach the server');
    }
    return this.lang.t('Något gick fel. Försök igen.', 'Something went wrong. Please try again.');
  }
}
