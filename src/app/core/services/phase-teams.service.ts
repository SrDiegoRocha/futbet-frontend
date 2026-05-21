import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  IMovePhaseTeamRequest,
  IPhaseTeamResponse,
} from '@core/interfaces/phase-team.interface';
import { API_BASE_URL } from '@core/services/api-config';

@Injectable({ providedIn: 'root' })
export class PhaseTeamsService {
  private readonly _http = inject(HttpClient);
  private readonly _baseUrl = inject(API_BASE_URL);

  public list(
    tournamentId: string,
    phaseId: string,
  ): Observable<IPhaseTeamResponse[]> {
    return this._http.get<IPhaseTeamResponse[]>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/phases/${phaseId}/teams`,
    );
  }

  public add(
    tournamentId: string,
    phaseId: string,
    teamId: string,
  ): Observable<IPhaseTeamResponse> {
    return this._http.post<IPhaseTeamResponse>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/phases/${phaseId}/teams/${teamId}`,
      {},
    );
  }

  public moveToGroup(
    tournamentId: string,
    phaseId: string,
    teamId: string,
    payload: IMovePhaseTeamRequest,
  ): Observable<IPhaseTeamResponse> {
    return this._http.put<IPhaseTeamResponse>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/phases/${phaseId}/teams/${teamId}`,
      payload,
    );
  }

  public remove(
    tournamentId: string,
    phaseId: string,
    teamId: string,
  ): Observable<void> {
    return this._http.delete<void>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/phases/${phaseId}/teams/${teamId}`,
    );
  }

  public draw(
    tournamentId: string,
    phaseId: string,
  ): Observable<IPhaseTeamResponse[]> {
    return this._http.post<IPhaseTeamResponse[]>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/phases/${phaseId}/teams/draw`,
      {},
    );
  }
}
