import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthComponent } from './auth.component';
import { AuthService } from '@core/services/auth.service';
import { environment } from '@env/environment';

describe('AuthComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [AuthComponent],
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  function create() {
    const fixture = TestBed.createComponent(AuthComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('should render login tab active by default', () => {
    const f = create();
    expect(f.componentInstance.isLogin()).toBe(true);
  });

  it('should switch to register mode', () => {
    const f = create();
    f.componentInstance.setMode('register');
    expect(f.componentInstance.isLogin()).toBe(false);
  });

  it('should disable submit when fields are empty', () => {
    const f = create();
    expect(f.componentInstance.canSubmit()).toBe(false);
  });

  it('should disable submit when password is shorter than 8 chars', () => {
    const f = create();
    f.componentInstance.email.set('test@example.com');
    f.componentInstance.password.set('short');
    expect(f.componentInstance.canSubmit()).toBe(false);
  });

  it('should enable submit when login fields are valid', () => {
    const f = create();
    f.componentInstance.email.set('test@example.com');
    f.componentInstance.password.set('longenough');
    expect(f.componentInstance.canSubmit()).toBe(true);
  });

  it('should require displayName in register mode', () => {
    const f = create();
    f.componentInstance.setMode('register');
    f.componentInstance.email.set('test@example.com');
    f.componentInstance.password.set('longenough');
    expect(f.componentInstance.canSubmit()).toBe(false);

    f.componentInstance.displayName.set('Test');
    expect(f.componentInstance.canSubmit()).toBe(true);
  });

  it('should call login and navigate to /home on submit', async () => {
    const f = create();
    const router = TestBed.inject(Router);
    const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    f.componentInstance.email.set('test@example.com');
    f.componentInstance.password.set('longenough');

    const promise = f.componentInstance.submit();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({
      accessToken: 'token',
      refreshToken: 'r',
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      user: { id: 'u1', email: 'test@example.com', displayName: 'Test', initial: 'T' },
    });
    await promise;

    expect(navSpy).toHaveBeenCalledWith(['/home']);
    expect(f.componentInstance.error()).toBeNull();
  });

  it('should show error message on 401', async () => {
    const f = create();
    f.componentInstance.email.set('test@example.com');
    f.componentInstance.password.set('longenough');

    const promise = f.componentInstance.submit();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ error: 'Invalid' }, { status: 401, statusText: 'Unauthorized' });
    await promise;

    expect(f.componentInstance.error()).toMatch(/Fel e-post|Invalid email/);
    expect(f.componentInstance.loading()).toBe(false);
  });

  it('should show error message on 409 during register', async () => {
    const f = create();
    f.componentInstance.setMode('register');
    f.componentInstance.email.set('taken@example.com');
    f.componentInstance.password.set('longenough');
    f.componentInstance.displayName.set('Taken');

    const promise = f.componentInstance.submit();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
    req.flush({ error: 'Already exists' }, { status: 409, statusText: 'Conflict' });
    await promise;

    expect(f.componentInstance.error()).toMatch(/redan registrerad|already registered/);
  });
});
