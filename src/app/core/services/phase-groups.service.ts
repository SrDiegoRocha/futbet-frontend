import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ICreatePhaseGroupRequest,
  IPhaseGroupResponse,
  IUpdatePhaseGroupRequest,
} from '@core/interfaces/phase-group.interface';
import { API_BASE_URL } from '@core/services/api-config';

@Injectable({ providedIn: 'root' })
export class PhaseGroupsService {
  private readonly _http = inject(HttpClient);
  private readonly _baseUrl = inject(API_BASE_URL);

  public list(
    tournamentId: string,
    phaseId: string,
  ): Observable<IPhaseGroupResponse[]> {
    return this._http.get<IPhaseGroupResponse[]>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/phases/${phaseId}/groups`,
    );
  }

  public create(
    tournamentId: string,
    phaseId: string,
    payload: ICreatePhaseGroupRequest,
  ): Observable<IPhaseGroupResponse> {
    return this._http.post<IPhaseGroupResponse>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/phases/${phaseId}/groups`,
      payload,
    );
  }

  public update(
    tournamentId: string,
    phaseId: string,
    groupId: string,
    payload: IUpdatePhaseGroupRequest,
  ): Observable<IPhaseGroupResponse> {
    return this._http.put<IPhaseGroupResponse>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/phases/${phaseId}/groups/${groupId}`,
      payload,
    );
  }

  public remove(
    tournamentId: string,
    phaseId: string,
    groupId: string,
  ): Observable<void> {
    return this._http.delete<void>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/phases/${phaseId}/groups/${groupId}`,
    );
  }
}
