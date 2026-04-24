import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '@env/environment';
import type { AuthResponse } from '../models/user.model';

const mockAuth: AuthResponse = {
  accessToken: 'jwt.token.value',
  refreshToken: 'refresh-token',
  expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  user: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'test@example.com',
    displayName: 'Test User',
    initial: 'T',
  },
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should start unauthenticated with no stored token', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('should POST /auth/login and store token + user', async () => {
    const promise = service.login({ email: 'test@example.com', password: 'secret123' });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@example.com', password: 'secret123' });
    req.flush(mockAuth);

    await promise;

    expect(service.getToken()).toBe('jwt.token.value');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.email).toBe('test@example.com');
  });

  it('should POST /auth/register and store token + user', async () => {
    const promise = service.register({ email: 'new@example.com', password: 'secret123', displayName: 'New' });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    req.flush(mockAuth);

    await promise;
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should clear storage on logout', async () => {
    localStorage.setItem('kvittoskan_token', 'x');
    localStorage.setItem('kvittoskan_user', JSON.stringify(mockAuth.user));
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    await service.logout();

    expect(service.getToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth']);
  });

  it('should treat expired token as not authenticated', () => {
    localStorage.setItem('kvittoskan_token', 'x');
    localStorage.setItem('kvittoskan_token_expires', new Date(Date.now() - 1000).toISOString());

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    const freshService = TestBed.inject(AuthService);
    expect(freshService.isAuthenticated()).toBe(false);
  });
});
