import { EventsWithoutShowing } from "src/services/event-svc/repository/events/events.repo";
import { EventStatus } from "src/shared/utils/status/status";
import { ShowingWithStatus } from "./showingWithStatus";

export interface EventWithStatus extends EventsWithoutShowing {
  status: EventStatus;
  minPrice: number;
  Showing: ShowingWithStatus[];
}

export function createEventWithStatus(
  event: EventsWithoutShowing,
  status: EventStatus,
  minPrice: number,
  showingWithStatus: ShowingWithStatus[]
): EventWithStatus {
  return {
    ...event,
    status,
    minPrice,
    Showing: showingWithStatus,
  };
}
  