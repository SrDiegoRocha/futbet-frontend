import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IStandingsResponse } from '@core/interfaces/standings.interface';
import { API_BASE_URL } from '@core/services/api-config';

@Injectable({ providedIn: 'root' })
export class StandingsService {
  private readonly _http = inject(HttpClient);
  private readonly _baseUrl = inject(API_BASE_URL);

  public get(
    tournamentId: string,
    phaseId: string,
  ): Observable<IStandingsResponse> {
    return this._http.get<IStandingsResponse>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/phases/${phaseId}/standings`,
    );
  }

  public finalize(
    tournamentId: string,
    phaseId: string,
  ): Observable<IStandingsResponse> {
    return this._http.post<IStandingsResponse>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/phases/${phaseId}/finalize`,
      {},
    );
  }
}
