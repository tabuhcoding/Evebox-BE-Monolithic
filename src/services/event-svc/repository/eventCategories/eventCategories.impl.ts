import { Inject, Injectable } from '@nestjs/common';
import { EventCategories, Prisma } from '@prisma/client';
import { Result, Ok, Err } from 'oxide.ts';

import { PrismaService } from 'src/infrastructure/database/prisma/prisma.service';
import { BaseRepository } from 'src/shared/repo/base.repository';
import { EventCategoriesRepository } from './eventCategories.repo';
import { CategoriesRepository } from '../categories/categories.repo';

@Injectable()
export class EventCategoriesRepositoryImpl
  extends BaseRepository<EventCategories, Prisma.EventCategoriesDelegate>
  implements EventCategoriesRepository {
  constructor(
    @Inject('CategoriesRepository') private readonly categoriesRepository: CategoriesRepository,
    protected readonly prisma: PrismaService
  ) {
    super(prisma.eventCategories, prisma);
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
}