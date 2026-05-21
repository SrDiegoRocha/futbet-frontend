import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { toHttpParams } from '@core/http/query-params';
import { IPage, IPageParams } from '@core/interfaces/api.interface';
import {
  IChangeStatusRequest,
  ICreateTournamentRequest,
  IJoinTournamentRequest,
  ITournamentResponse,
  IUpdateTournamentRequest,
} from '@core/interfaces/tournament.interface';
import { API_BASE_URL } from '@core/services/api-config';

@Injectable({ providedIn: 'root' })
export class TournamentsService {
  private readonly _http = inject(HttpClient);
  private readonly _baseUrl = inject(API_BASE_URL);

  public create(
    payload: ICreateTournamentRequest,
  ): Observable<ITournamentResponse> {
    return this._http.post<ITournamentResponse>(
      `${this._baseUrl}/api/tournaments`,
      payload,
    );
  }

  public update(
    id: string,
    payload: IUpdateTournamentRequest,
  ): Observable<ITournamentResponse> {
    return this._http.put<ITournamentResponse>(
      `${this._baseUrl}/api/tournaments/${id}`,
      payload,
    );
  }

  public getById(id: string): Observable<ITournamentResponse> {
    return this._http.get<ITournamentResponse>(
      `${this._baseUrl}/api/tournaments/${id}`,
    );
  }

  public listMine(
    params?: IPageParams,
  ): Observable<IPage<ITournamentResponse>> {
    return this._http.get<IPage<ITournamentResponse>>(
      `${this._baseUrl}/api/tournaments/mine`,
      { params: toHttpParams(params ?? null) },
    );
  }

  public listPublic(
    params?: IPageParams,
  ): Observable<IPage<ITournamentResponse>> {
    return this._http.get<IPage<ITournamentResponse>>(
      `${this._baseUrl}/api/tournaments/public`,
      { params: toHttpParams(params ?? null) },
    );
  }

  public listJoined(
    params?: IPageParams,
  ): Observable<IPage<ITournamentResponse>> {
    return this._http.get<IPage<ITournamentResponse>>(
      `${this._baseUrl}/api/tournaments/joined`,
      { params: toHttpParams(params ?? null) },
    );
  }

  public changeStatus(
    id: string,
    payload: IChangeStatusRequest,
  ): Observable<ITournamentResponse> {
    return this._http.post<ITournamentResponse>(
      `${this._baseUrl}/api/tournaments/${id}/status`,
      payload,
    );
  }

  public regenerateInviteCode(id: string): Observable<ITournamentResponse> {
    return this._http.post<ITournamentResponse>(
      `${this._baseUrl}/api/tournaments/${id}/invite-code/regenerate`,
      {},
    );
  }

  public remove(id: string): Observable<void> {
    return this._http.delete<void>(`${this._baseUrl}/api/tournaments/${id}`);
  }

  public join(
    payload: IJoinTournamentRequest,
  ): Observable<ITournamentResponse> {
    return this._http.post<ITournamentResponse>(
      `${this._baseUrl}/api/tournaments/join`,
      payload,
    );
  }
}
