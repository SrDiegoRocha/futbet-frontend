export interface IPhaseTeamResponse {
  teamId: string;
  teamName: string;
  shortName: string | null;
  badgeUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  groupId: string | null;
  groupName: string | null;
  addedAt: string;
}

export interface IMovePhaseTeamRequest {
  groupId: string | null;
}
