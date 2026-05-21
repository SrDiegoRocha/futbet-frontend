import { HttpBackend, HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { finalize, map, Observable, shareReplay, throwError } from 'rxjs';
import { AuthState } from '@core/auth/auth-state';
import {
  IAuthResponse,
  IRefreshTokenRequest,
} from '@core/interfaces/auth.interface';
import { API_BASE_URL } from '@core/services/api-config';

@Injectable({ providedIn: 'root' })
export class TokenRefresher {
  private readonly _state = inject(AuthState);
  private readonly _baseUrl = inject(API_BASE_URL);
  private readonly _http = new HttpClient(inject(HttpBackend));

  private _inFlight: Observable<string> | null = null;

  public refresh(): Observable<string> {
    if (this._inFlight) return this._inFlight;

    const refreshToken = this._state.refreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const body: IRefreshTokenRequest = { refreshToken };
    this._inFlight = this._http
      .post<IAuthResponse>(`${this._baseUrl}/api/auth/refresh`, body)
      .pipe(
        map((auth) => {
          this._state.applyRefreshedTokens(auth.accessToken, auth.refreshToken);
          return auth.accessToken;
        }),
        finalize(() => {
          this._inFlight = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this._inFlight;
  }
}
