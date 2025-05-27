import { Prisma } from "@prisma/client";
import { Result } from "oxide.ts";
import { BaseRepository } from "src/shared/repo/base.repository";
import { CreateShowingDto } from "../../modules/showing/command/createShowing/createShowing.dto";
import { UpdateShowingDto } from "../../modules/showing/command/updateShowing/updateShowing.dto";

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

export interface ShowingRepository extends BaseRepository<Showing, Prisma.ShowingDelegate> {
  checkAuthor(id: string, userId: string): Promise<Result<boolean, Error>>;
  /* Create Showing */
  createShowing(dto: CreateShowingDto, eventId: number): Promise<Result<[string, boolean], Error>>;

  /* Update Showing */
  updateShowing(dto: UpdateShowingDto, id: string): Promise<Result<[string, boolean], Error>>;

  /* Delete Showing */
  deleteShowing(id: string): Promise<Result<string, Error>>;
}