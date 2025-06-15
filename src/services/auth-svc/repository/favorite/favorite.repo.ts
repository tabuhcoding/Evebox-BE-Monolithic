import { FavoriteNotiHistory, ItemType} from '@prisma/client';
import { BaseRepository } from "src/shared/repo/base.repository";
import { Prisma } from "@prisma/client";
import { Pagination, PaginationQuery } from 'src/shared/constants/pagination';

export { FavoriteNotiHistory }

export { ItemType } from '@prisma/client';

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

  getFavoriteEventIds(userId: string, pagination: PaginationQuery): Promise<[number[], Pagination]>;

  getFavoriteOrgs(userId: string, pagination: PaginationQuery): Promise<[{ orgId: string }[], Pagination]>;
  updateIsNotified(id: string, isNotified: boolean): Promise<void>;
  getUserIdsNotifiedByEvent(eventId: number): Promise<{ userId: string }[]>;
  getUserIdsNotifiedByOrganizer(orgId: string): Promise<{ userId: string }[]>;
}