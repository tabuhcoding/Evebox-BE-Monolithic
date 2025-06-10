import { Prisma } from "@prisma/client";
import { Result } from "oxide.ts";
import { BaseRepository } from "src/shared/repo/base.repository";
import { CreateShowingDto } from "../../modules/showing/command/createShowing/createShowing.dto";
import { UpdateShowingDto } from "../../modules/showing/command/updateShowing/updateShowing.dto";
import { ShowingDataDto } from "../../modules/showing/queries/getShowingsByAdmin/getShowings-response.dto";

export type ShowingWithEvent = Prisma.ShowingGetPayload<{
  include: {
    Events: {
      select: {
        id: true,
        title: true,
      }
    };
    TicketType: true
  }
}>

export interface ShowingWithEventRepository extends BaseRepository<ShowingWithEvent, Prisma.ShowingDelegate> {
  
}