import { Inject, Injectable } from '@nestjs/common';
import { EventCategories, Prisma } from 'prisma/client-event';
import { Result, Ok, Err } from 'oxide.ts';

import { PrismaEventService } from '../../database/prisma-event/prisma.service';
import { BaseEventRepository } from '../base.repository';
import { EventCategoriesRepository } from './eventCategories.repo';
import { CategoriesRepository } from '../categories/categories.repo';
import { CategoriesResponseDto } from '../../modules/categories/queries/getAllCategories-response.dto';

@Injectable()
export class EventCategoriesRepositoryImpl
  extends BaseEventRepository<EventCategories, Prisma.EventCategoriesDelegate>
  implements EventCategoriesRepository {
  constructor(
    @Inject('CategoriesRepository') private readonly categoriesRepository: CategoriesRepository,
    protected readonly prisma: PrismaEventService
  ) {
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

  async createEventCategory(eventId: number, categoryIds: number[]): Promise<Result<any, Error>> {
    let parsedCategoryIds: number[];

    if (typeof categoryIds === 'string') {
      try {
        parsedCategoryIds = JSON.parse(categoryIds);
      } catch (error) {
        throw new Error('Failed to parsed category ids');
      }
    } else {
      parsedCategoryIds = categoryIds;
    }

    try {
      const categories = await this.findMany({
        id: {
          in: parsedCategoryIds
        }
      });
      if (categories.length === 0) {
        return Err(new Error('Categories not found'));
      }

      const eventCategory = categories.map(category => {
        return {
          eventId: eventId,
          categoryId: category.id
        }
      })

      await this.insertMany(eventCategory);

      return Ok(undefined);
    }
    catch (error) {
      return Err(new Error('Failed to create event category'));
    }
  }

  async updateEventCategory(eventId: number, categoryIds: number[]): Promise<Result<any, Error>> {
    let parsedCategoryIds: number[];

    if (typeof categoryIds === 'string') {
      try {
        parsedCategoryIds = JSON.parse(categoryIds);
      } catch (error) {
        return Err(new Error('Invalid categoryIds format'));
      }
    } else {
      parsedCategoryIds = categoryIds;
    }

    try {
      // Remove all existing event categories
      await this.deleteHardMany({
        eventId: eventId >> 0,
      });
      // If new categories are provided, add them
      if (parsedCategoryIds.length > 0) {
        const categories = await this.categoriesRepository.findMany({
          id: {
            in: parsedCategoryIds,
          }
        });

        if (categories.length === 0) {
          return Err(new Error('Categories not found'));
        }

        const eventCategory = categories.map(category => ({
          eventId: eventId >> 0,
          categoryId: category.id
        }));

        await this.insertMany(eventCategory);

        return Ok(undefined);
      }
      return Ok([]);
    } catch (error) {
      return Err(new Error('Failed to update event category'));
    }
  }

  async getCategoriesByEventId(eventId: number): Promise<{ id: number; name: string }[]> {
    const categories = await this.prisma.eventCategories.findMany({
      where: { eventId },
      select: {
        Categories: {
          select: { id: true, name: true },
        },
      },
    });

    return categories.map(c => c.Categories);
  }
}