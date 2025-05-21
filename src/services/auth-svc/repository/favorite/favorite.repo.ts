import { FavoriteNotiHistory, ItemType} from '@prisma/client';
import { BaseRepository } from "src/shared/repo/base.repository";
import { Prisma } from "@prisma/client";

export { FavoriteNotiHistory }

export interface FavoriteRepository
  extends BaseRepository<FavoriteNotiHistory, Prisma.FavoriteNotiHistoryDelegate> {
    findFavorite(
    userId: string,
    itemType: ItemType,
    orgId?: string,
    eventId?: number,
  ): Promise<FavoriteNotiHistory | null>;

  updateFavoriteStatus(id: string, isFavorite: boolean): Promise<void>;

  addFavorite(
    userId: string,
    itemType: ItemType,
    orgId?: string,
    eventId?: number,
  ): Promise<void>;

  getFavoriteEventIds(userId: string): Promise<number[]>;
}