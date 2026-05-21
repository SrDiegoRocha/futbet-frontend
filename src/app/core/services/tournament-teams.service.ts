import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { toHttpParams } from '@core/http/query-params';
import { IPage, IPageParams } from '@core/interfaces/api.interface';
import { ITournamentTeamResponse } from '@core/interfaces/tournament-team.interface';
import { API_BASE_URL } from '@core/services/api-config';

@Injectable({ providedIn: 'root' })
export class TournamentTeamsService {
  private readonly _http = inject(HttpClient);
  private readonly _baseUrl = inject(API_BASE_URL);

  public list(
    tournamentId: string,
    params?: IPageParams,
  ): Observable<IPage<ITournamentTeamResponse>> {
    return this._http.get<IPage<ITournamentTeamResponse>>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/teams`,
      { params: toHttpParams(params ?? null) },
    );
  }

  public attach(
    tournamentId: string,
    teamId: string,
  ): Observable<ITournamentTeamResponse> {
    return this._http.post<ITournamentTeamResponse>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/teams/${teamId}`,
      {},
    );
  }

  public detach(tournamentId: string, teamId: string): Observable<void> {
    return this._http.delete<void>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/teams/${teamId}`,
    );
  }
}
