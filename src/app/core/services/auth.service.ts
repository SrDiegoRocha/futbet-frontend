import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthState } from '@core/auth/auth-state';
import {
  IAuthResponse,
  ISignInRequest,
  ISignUpRequest,
} from '@core/interfaces/auth.interface';
import { API_BASE_URL } from '@core/services/api-config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _http = inject(HttpClient);
  private readonly _baseUrl = inject(API_BASE_URL);
  private readonly _state = inject(AuthState);

  public signUp(payload: ISignUpRequest): Observable<IAuthResponse> {
    return this._http
      .post<IAuthResponse>(`${this._baseUrl}/api/auth/signup`, payload)
      .pipe(tap((auth) => this._state.applyAuthResponse(auth)));
  }

  public signIn(payload: ISignInRequest): Observable<IAuthResponse> {
    return this._http
      .post<IAuthResponse>(`${this._baseUrl}/api/auth/signin`, payload)
      .pipe(tap((auth) => this._state.applyAuthResponse(auth)));
  }

  public signOut(): void {
    this._state.clear();
  }
}
