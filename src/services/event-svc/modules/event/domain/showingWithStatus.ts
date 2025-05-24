import { Showing } from "src/services/event-svc/repository/showing/showing.repo";
import { ShowingStatus } from "src/shared/utils/status/status";

export interface ShowingWithStatus extends Showing {
  status: ShowingStatus; 
  minPrice: number;
}

export function createShowingWithStatus(showing: Showing, status: ShowingStatus, minPrice: number): ShowingWithStatus {
  return {
    ...showing,
    status,
    minPrice,
  };
}