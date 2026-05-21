import { ZoneSelectionMode } from '@core/interfaces/enums';

export interface IZoneResponse {
  id: string;
  name: string;
  fromPosition: number;
  toPosition: number;
  selectionMode: ZoneSelectionMode;
  bestRankedCount: number | null;
  nextPhaseId: string | null;
  nextPhaseName: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateZoneRequest {
  name: string;
  fromPosition: number;
  toPosition: number;
  selectionMode: ZoneSelectionMode;
  bestRankedCount?: number | null;
  nextPhaseId?: string | null;
}

export interface IUpdateZoneRequest extends ICreateZoneRequest {}
