export interface IPredictionResponse {
  id: string;
  matchId: string;
  userId: string;
  userName: string;
  homeScore: number;
  awayScore: number;
  points: number;
  createdAt: string;
  updatedAt: string;
}

export interface IPlacePredictionRequest {
  homeScore: number;
  awayScore: number;
}
