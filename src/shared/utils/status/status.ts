import { TicketTypeStatus } from "src/services/event-svc/repository/ticketType/ticketType.repo";
import { Events } from "src/services/event-svc/repository/events/events.repo";
import { Showing } from "src/services/event-svc/repository/showing/showing.repo";
import { TicketType } from "src/services/event-svc/repository/ticketType/ticketType.repo";

export enum ShowingStatus {
 SOLD_OUT = 'SOLD_OUT',
 REGISTER_NOW = 'REGISTER_NOW',
 BOOK_NOW = 'BOOK_NOW',
 NOT_OPEN = 'NOT_OPEN',
 REGISTER_CLOSE = 'REGISTER_CLOSED',
 SALE_CLOSE = 'SALE_CLOSED', 
}

export enum EventStatus {
  AVAILABLE = 'AVAILABLE',
  NOT_OPEN = 'NOT_OPEN',
  SALE_CLOSE = 'SALE_CLOSE',
  REGISTER_CLOSE = 'REGISTER_CLOSE',
  SOLD_OUT = 'SOLD_OUT',
  EVENT_OVER = 'EVENT_OVER',
}

export function calculateShowingStatusAndMinPrice(ticketTypes: TicketType[]): Promise<[ShowingStatus, number]> {
  let showingStatus = ShowingStatus.SOLD_OUT;
  let minPrice = Number.MAX_VALUE;

  if (ticketTypes?.length === 0) {
    console.log("No ticket types available");
    return Promise.resolve([ShowingStatus.SOLD_OUT, 0]);
  }

  for (const ticketType of ticketTypes) {
    // Update showing status based on ticket type status
    if (ticketType.status === TicketTypeStatus.REGISTER_NOW) {
      showingStatus = ShowingStatus.REGISTER_NOW;
    }
    else if (ticketType.status === TicketTypeStatus.BOOK_NOW && showingStatus !== ShowingStatus.REGISTER_NOW) {
      showingStatus = ShowingStatus.BOOK_NOW;
    }
    else if (ticketType.status === TicketTypeStatus.NOT_OPEN && [ShowingStatus.SOLD_OUT, ShowingStatus.REGISTER_NOW, ShowingStatus.BOOK_NOW].includes(showingStatus)) {
      showingStatus = ShowingStatus.NOT_OPEN;
    }
    else if (ticketType.status === TicketTypeStatus.REGISTER_CLOSED && [ShowingStatus.SOLD_OUT, ShowingStatus.REGISTER_NOW, ShowingStatus.BOOK_NOW, ShowingStatus.NOT_OPEN, ShowingStatus.SALE_CLOSE].includes(showingStatus)) {
      showingStatus = ShowingStatus.REGISTER_CLOSE;
    }
    
    else if (ticketType.status === TicketTypeStatus.SALE_CLOSED && [ShowingStatus.SOLD_OUT, ShowingStatus.REGISTER_NOW, ShowingStatus.BOOK_NOW, ShowingStatus.NOT_OPEN].includes(showingStatus)) {
      showingStatus = ShowingStatus.SALE_CLOSE;
    }

    // Update min price
    if (ticketType.price < minPrice) {
      minPrice = ticketType.price;
    }
  }
  
  return Promise.resolve([ShowingStatus.REGISTER_NOW, minPrice]);
}

export async function calculateEventStatusAndMinPriceAndStartDate(event: Events): Promise<[EventStatus, number, Date]> {
  let eventStatus = EventStatus.AVAILABLE;
  let minPrice = Number.MAX_VALUE;
  let showingStatusSet = new Set<ShowingStatus>();
  let startTime = new Date("9999-12-31T23:59:59.999Z");
  let nowDate = new Date();

  if ( !event.Showing || event.Showing?.length === 0) {
    console.log("Event has no showings");
    return Promise.resolve([EventStatus.EVENT_OVER, 0, new Date("9999-12-31T23:59:59.999Z")]);
  }

  for (const showing of event.Showing) {
    // Calculate showing status and min price
    const [showingStatus, showingMinPrice] = await calculateShowingStatusAndMinPrice(showing.TicketType);
    showingStatusSet.add(showingStatus);
    // Update min price
    if (showingMinPrice < minPrice) {
      minPrice = showingMinPrice;
    }
    // Update start date
    if (new Date(showing.startTime) < startTime && new Date(showing.startTime) > nowDate) {
      startTime = new Date(showing.startTime);
    }
  }

  // Determine event status based on showing statuses
  if (showingStatusSet.has(ShowingStatus.BOOK_NOW) || showingStatusSet.has(ShowingStatus.REGISTER_NOW)) {
    eventStatus = EventStatus.AVAILABLE;
  }
  else if (showingStatusSet.has(ShowingStatus.NOT_OPEN)) {
    eventStatus = EventStatus.NOT_OPEN;
  }
  else if (showingStatusSet.has(ShowingStatus.SALE_CLOSE)) {
    eventStatus = EventStatus.SALE_CLOSE;
  }
  else if (showingStatusSet.has(ShowingStatus.REGISTER_CLOSE)) {
    eventStatus = EventStatus.REGISTER_CLOSE;
  }
  else if (showingStatusSet.has(ShowingStatus.SOLD_OUT)) {
    eventStatus = EventStatus.SOLD_OUT;
  }
  else {
    eventStatus = EventStatus.EVENT_OVER;
  }

  return Promise.resolve([eventStatus, minPrice, startTime]);
}
