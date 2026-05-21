import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  IPlacePredictionRequest,
  IPredictionResponse,
} from '@core/interfaces/prediction.interface';
import { API_BASE_URL } from '@core/services/api-config';

@Injectable({ providedIn: 'root' })
export class PredictionsService {
  private readonly _http = inject(HttpClient);
  private readonly _baseUrl = inject(API_BASE_URL);

  public upsertMine(
    tournamentId: string,
    matchId: string,
    payload: IPlacePredictionRequest,
  ): Observable<IPredictionResponse> {
    return this._http.put<IPredictionResponse>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/matches/${matchId}/predictions/me`,
      payload,
    );
  }

  public removeMine(
    tournamentId: string,
    matchId: string,
  ): Observable<void> {
    return this._http.delete<void>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/matches/${matchId}/predictions/me`,
    );
  }

  public listForMatch(
    tournamentId: string,
    matchId: string,
  ): Observable<IPredictionResponse[]> {
    return this._http.get<IPredictionResponse[]>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/matches/${matchId}/predictions`,
    );
  }

  public listMineInTournament(
    tournamentId: string,
  ): Observable<IPredictionResponse[]> {
    return this._http.get<IPredictionResponse[]>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/predictions/me`,
    );
  }
}
