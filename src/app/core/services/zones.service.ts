import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ICreateZoneRequest,
  IUpdateZoneRequest,
  IZoneResponse,
} from '@core/interfaces/zone.interface';
import { API_BASE_URL } from '@core/services/api-config';

@Injectable({ providedIn: 'root' })
export class ZonesService {
  private readonly _http = inject(HttpClient);
  private readonly _baseUrl = inject(API_BASE_URL);

  public list(
    tournamentId: string,
    phaseId: string,
  ): Observable<IZoneResponse[]> {
    return this._http.get<IZoneResponse[]>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/phases/${phaseId}/zones`,
    );
  }

  public create(
    tournamentId: string,
    phaseId: string,
    payload: ICreateZoneRequest,
  ): Observable<IZoneResponse> {
    return this._http.post<IZoneResponse>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/phases/${phaseId}/zones`,
      payload,
    );
  }

  public update(
    tournamentId: string,
    phaseId: string,
    zoneId: string,
    payload: IUpdateZoneRequest,
  ): Observable<IZoneResponse> {
    return this._http.put<IZoneResponse>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/phases/${phaseId}/zones/${zoneId}`,
      payload,
    );
  }

  public remove(
    tournamentId: string,
    phaseId: string,
    zoneId: string,
  ): Observable<void> {
    return this._http.delete<void>(
      `${this._baseUrl}/api/tournaments/${tournamentId}/phases/${phaseId}/zones/${zoneId}`,
    );
  }
}
