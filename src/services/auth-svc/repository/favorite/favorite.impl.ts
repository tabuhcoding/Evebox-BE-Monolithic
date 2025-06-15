import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/database/prisma/prisma.service';
import { BaseRepository } from 'src/shared/repo/base.repository';
import { FavoriteNotiHistory, ItemType, Prisma } from '@prisma/client';
import { FavoriteRepository } from './favorite.repo';
import { Pagination, PaginationQuery } from 'src/shared/constants/pagination';

@Injectable()
export class FavoriteRepositoryImpl 
extends BaseRepository<FavoriteNotiHistory, Prisma.FavoriteNotiHistoryDelegate>
implements FavoriteRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.favoriteNotiHistory, prisma);
  }

  async findFavorite(
    userId: string,
    itemType: ItemType,
    orgId?: string,
    eventId?: number,
  ): Promise<FavoriteNotiHistory | null> {
    return this.prisma.favoriteNotiHistory.findFirst({
      where: {
        userId,
        itemType,
        orgId: orgId ?? undefined,
        eventId: eventId ?? undefined,
      },
    });
  }

  async updateFavoriteStatus(id: string, isFavorite: boolean): Promise<void> {
    await this.prisma.favoriteNotiHistory.update({
      where: { id },
      data: { isFavorite },
    });
  }

  async addFavorite(
    userId: string,
    itemType: ItemType,
    orgId?: string,
    eventId?: number,
  ): Promise<void> {
    await this.prisma.favoriteNotiHistory.create({
      data: {
        userId,
        itemType,
        orgId,
        eventId,
        isFavorite: true,
        isNotified: false,
      },
    });
  }

  async getFavoriteEventIds(
    userId: string,
    paginationQuery: PaginationQuery
  ): Promise<[number[], Pagination]> {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const skip = (page - 1) * limit;

    // Lấy tổng số bản ghi thỏa mãn điều kiện
    const totalItems = await this.prisma.favoriteNotiHistory.count({
      where: {
        userId,
        isFavorite: true,
        itemType: 'EVENT',
      },
    });

    // Tính tổng số trang
    const totalPages = Math.ceil(totalItems / limit);

    // Lấy bản ghi theo phân trang
    const records = await this.prisma.favoriteNotiHistory.findMany({
      where: {
        userId,
        isFavorite: true,
        itemType: 'EVENT',
      },
      select: {
        eventId: true,
      },
      skip,
      take: limit,
    });

    const eventIds = records.map(r => r.eventId!).filter(id => id !== null);

    const pagination = new Pagination(page, limit, totalItems, totalPages);
    return [eventIds, pagination];
  }


async getFavoriteOrgs(userId: string): Promise<{ orgId: string }[]> {
  return this.prisma.favoriteNotiHistory.findMany({
    where: {
      userId,
      isFavorite: true,
      itemType: 'ORG', // assuming string enum or constant
    },
    select: {
      orgId: true,
    },
  });
}
  
   async updateIsNotified(id: string, isNotified: boolean): Promise<void> {
    await this.prisma.favoriteNotiHistory.update({
      where: { id },
      data: { isNotified },
    });
  }

  async getUserIdsNotifiedByEvent(eventId: number): Promise<{ userId: string }[]> {
  return this.prisma.favoriteNotiHistory.findMany({
    where: {
      itemType: 'EVENT',
      eventId,
      isNotified: true,
      isFavorite: true,
    },
    select: {
      userId: true,
    },
  });
  }

  async getUserIdsNotifiedByOrganizer(orgId: string): Promise<{ userId: string }[]> {
  return this.prisma.favoriteNotiHistory.findMany({
    where: {
      itemType: 'ORG',
      orgId,
      isNotified: true,
      isFavorite: true,
    },
    select: {
      userId: true,
    },
  });
}

}