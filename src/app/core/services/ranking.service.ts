import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IRankingRowResponse } from '@core/interfaces/ranking.interface';
import { API_BASE_URL } from '@core/services/api-config';

@Injectable({ providedIn: 'root' })
export class RankingService {
  private readonly _http = inject(HttpClient);
  private readonly _baseUrl = inject(API_BASE_URL);

  public list(tournamentId: string): Observable<IRankingRowResponse[]> {
    return this._http.get<IRankingRowResponse[]>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/ranking`,
    );
  }
}
