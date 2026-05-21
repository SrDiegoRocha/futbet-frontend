import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthState } from '@core/auth/auth-state';

export const authGuard: CanActivateFn = () => {
  const state = inject(AuthState);
  const router = inject(Router);

  if (state.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/auth/signin']);
};
