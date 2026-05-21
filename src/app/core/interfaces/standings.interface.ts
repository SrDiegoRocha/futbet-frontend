export interface IStandingRow {
  position: number;
  teamId: string;
  teamName: string;
  shortName: string | null;
  badgeUrl: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface IGroupStandings {
  groupId: string | null;
  groupName: string | null;
  rows: IStandingRow[];
}

export interface IStandingsResponse {
  phaseId: string;
  groups: IGroupStandings[];
}
