import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthState } from '@core/auth/auth-state';
import { TokenRefresher } from '@core/auth/token-refresher';
import { ApiException } from '@core/errors/api-error';

const PUBLIC_AUTH_PATHS = [
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/refresh',
];

function isPublicAuthPath(url: string): boolean {
  return PUBLIC_AUTH_PATHS.some((p) => url.includes(p));
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const state = inject(AuthState);
  const refresher = inject(TokenRefresher);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isPublicAuthPath(req.url)) {
        return throwError(() => new ApiException(error));
      }

      if (!state.refreshToken()) {
        state.clear();
        void router.navigate(['/auth/signin']);
        return throwError(() => new ApiException(error));
      }

      return refresher.refresh().pipe(
        switchMap((newAccessToken) =>
          next(
            req.clone({
              setHeaders: { Authorization: `Bearer ${newAccessToken}` },
            }),
          ),
        ),
        catchError((refreshError) => {
          state.clear();
          void router.navigate(['/auth/signin']);
          const wrapped =
            refreshError instanceof HttpErrorResponse
              ? new ApiException(refreshError)
              : refreshError;
          return throwError(() => wrapped);
        }),
      );
    }),
  );
};
