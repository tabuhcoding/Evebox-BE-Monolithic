import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/database/prisma/prisma.service';
import { BaseRepository } from 'src/shared/repo/base.repository';
import { FavoriteNotiHistory, ItemType, Prisma } from '@prisma/client';
import { FavoriteRepository } from './favorite.repo';

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
}