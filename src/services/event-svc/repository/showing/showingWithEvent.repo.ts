import { Prisma } from "prisma/client-event";
import { Result } from "oxide.ts";
import { BaseEventRepository } from '../base.repository';
import { CreateShowingDto } from "../../modules/showing/command/createShowing/createShowing.dto";
import { UpdateShowingDto } from "../../modules/showing/command/updateShowing/updateShowing.dto";
import { ShowingDataDto } from "../../modules/showing/queries/getShowingsByAdmin/getShowings-response.dto";

export type ShowingWithEvent = Prisma.ShowingGetPayload<{
  include: {
    Events: {
      select: {
        id: true,
        title: true,
        venue: true,
        organizerId: true;
        locations: {
          include: {
            districts: {
              include: {
                province: true;
              };
            };
          };
        };
        imgPosterUrl: true,
      }
    };
    TicketType: true
  }
}>

export interface ShowingWithEventRepository extends BaseEventRepository<ShowingWithEvent, Prisma.ShowingDelegate> {
  
}