import { Prisma } from "prisma/client-event";
import { Result } from "oxide.ts";
import { BaseEventRepository } from '../base.repository';
import { CreateShowingDto } from "../../modules/showing/command/createShowing/createShowing.dto";
import { UpdateShowingDto } from "../../modules/showing/command/updateShowing/updateShowing.dto";
import { ShowingDataDto } from "../../modules/showing/queries/getShowingsByAdmin/getShowings-response.dto";

export type Showing = Prisma.ShowingGetPayload<{
  include: {
    // Event: {
    //   include: {
    //     locations: {
    //       include: {
    //         districts: {
    //           include: {
    //             province: true;
    //           };
    //         };
    //       };
    //     };
    //     EventCategories: {
    //       include: {
    //         Categories: true;
    //       };
    //     };
    //   };
    // };
    TicketType: true;
  };
}>;

export type EventWithShowings = Prisma.ShowingGetPayload<{
  select: {
    id: true;
    startTime: true;
    endTime: true;
    TicketType: true;
  };
}>;


export interface ShowingRepository extends BaseEventRepository<Showing, Prisma.ShowingDelegate> {
  checkAuthor(id: string, userId: string): Promise<Result<boolean, Error>>;
  /* Create Showing */
  createShowing(dto: CreateShowingDto, eventId: number): Promise<Result<[string, boolean], Error>>;

  /* Update Showing */
  updateShowing(dto: UpdateShowingDto, id: string): Promise<Result<[string, boolean], Error>>;

  /* Delete Showing */
  deleteShowing(id: string): Promise<Result<string, Error>>;
  findAdminShowingById(showingId: string): Promise<any>;
  getShowingStatusData(showingId: string): Promise<any>;
  findWithFilters(filters: any): Promise<ShowingDataDto[]>;
  count(filters: any): Promise<number>;
  getBasicShowingDetail(showingId: string, ticketTypeId: string): Promise<any>;
  findShowingsByOrgAndEvent(orgId: string, eventId: number): Promise<EventWithShowings[]>;
  findOneByIdWithTicketTypes(
  showingId: string,
  eventId: number,
  organizerId: string
): Promise<{
  id: string;
  startTime: Date;
  endTime: Date;
  Events: {
    id: number;
    title: string;
  };
  TicketType: {
    id: string;
    name: string;
    price: number;
    quantity: number | null;
  }[];
} | null>;

  findAllWithTicketTypesByEventId(eventId: number): Promise<any[]>;
}