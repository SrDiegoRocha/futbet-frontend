import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { toHttpParams } from '@core/http/query-params';
import { IPage, IPageParams } from '@core/interfaces/api.interface';
import { ITournamentMemberResponse } from '@core/interfaces/tournament-member.interface';
import { API_BASE_URL } from '@core/services/api-config';

@Injectable({ providedIn: 'root' })
export class TournamentMembersService {
  private readonly _http = inject(HttpClient);
  private readonly _baseUrl = inject(API_BASE_URL);

  public list(
    tournamentId: string,
    params?: IPageParams,
  ): Observable<IPage<ITournamentMemberResponse>> {
    return this._http.get<IPage<ITournamentMemberResponse>>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/members`,
      { params: toHttpParams(params ?? null) },
    );
  }

  public leave(tournamentId: string): Observable<void> {
    return this._http.delete<void>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/members/me`,
    );
  }

  public ban(tournamentId: string, userId: string): Observable<void> {
    return this._http.delete<void>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/members/${userId}`,
    );
  }
}
