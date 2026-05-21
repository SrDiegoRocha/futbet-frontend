import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthState } from '@core/auth/auth-state';

const PUBLIC_AUTH_PATHS = [
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/refresh',
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (PUBLIC_AUTH_PATHS.some((p) => req.url.includes(p))) {
    return next(req);
  }

  const token = inject(AuthState).accessToken();
  if (!token) {
    return next(req);
  }

  const authorized = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(authorized);
};
