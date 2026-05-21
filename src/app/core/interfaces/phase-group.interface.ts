export interface IPhaseGroupResponse {
  id: string;
  name: string;
  position: number;
  teamCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICreatePhaseGroupRequest {
  name: string;
}

export interface IUpdatePhaseGroupRequest extends ICreatePhaseGroupRequest {}
