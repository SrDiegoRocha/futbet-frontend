import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ICreatePhaseRequest,
  IMovePhaseRequest,
  IPhaseResponse,
  IUpdatePhaseRequest,
} from '@core/interfaces/phase.interface';
import { IStandingsResponse } from '@core/interfaces/standings.interface';
import { API_BASE_URL } from '@core/services/api-config';

@Injectable({ providedIn: 'root' })
export class PhasesService {
  private readonly _http = inject(HttpClient);
  private readonly _baseUrl = inject(API_BASE_URL);

  public list(tournamentId: string): Observable<IPhaseResponse[]> {
    return this._http.get<IPhaseResponse[]>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/phases`,
    );
  }

  public getById(
    tournamentId: string,
    phaseId: string,
  ): Observable<IPhaseResponse> {
    return this._http.get<IPhaseResponse>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/phases/${phaseId}`,
    );
  }

  public create(
    tournamentId: string,
    payload: ICreatePhaseRequest,
  ): Observable<IPhaseResponse> {
    return this._http.post<IPhaseResponse>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/phases`,
      payload,
    );
  }

  public update(
    tournamentId: string,
    phaseId: string,
    payload: IUpdatePhaseRequest,
  ): Observable<IPhaseResponse> {
    return this._http.put<IPhaseResponse>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/phases/${phaseId}`,
      payload,
    );
  }

  public move(
    tournamentId: string,
    phaseId: string,
    payload: IMovePhaseRequest,
  ): Observable<IPhaseResponse> {
    return this._http.post<IPhaseResponse>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/phases/${phaseId}/move`,
      payload,
    );
  }

  public remove(tournamentId: string, phaseId: string): Observable<void> {
    return this._http.delete<void>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/phases/${phaseId}`,
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
