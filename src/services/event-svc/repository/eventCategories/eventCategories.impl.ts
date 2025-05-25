import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/database/prisma/prisma.service';
import { BaseRepository } from 'src/shared/repo/base.repository';
import { EventCategories, Prisma } from '@prisma/client';
import { EventCategoriesRepository } from './eventCategories.repo';
import { CategoriesResponseDto } from '../../modules/categories/queries/getAllCategories-response.dto';

@Injectable()
export class EventCategoriesRepositoryImpl
  extends BaseRepository<EventCategories, Prisma.EventCategoriesDelegate>
  implements EventCategoriesRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.eventCategories, prisma);
  }

  async updateEventCategories(
  eventId: number,
  categoryIds: number[],
  isSpecial: boolean,
): Promise<void> {
  // Remove old relations
  await this.prisma.eventCategories.deleteMany({
    where: { eventId },
  });

  // Insert new relations
  const data = categoryIds.map((categoryId) => ({
    eventId,
    categoryId,
    isSpecial,
  }));

  await this.prisma.eventCategories.createMany({ data });
}

 async getEventCategories(eventId: number): Promise<CategoriesResponseDto[]> {
  const categories = await this.prisma.eventCategories.findMany({
    where: { eventId },
    include: {
      Categories: {
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      },
    },
  });

  return categories.map((entry) => entry.Categories); 
}
}