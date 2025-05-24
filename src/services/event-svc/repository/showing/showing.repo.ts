import { Prisma } from "@prisma/client";
import { BaseRepository } from "src/shared/repo/base.repository";

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
}