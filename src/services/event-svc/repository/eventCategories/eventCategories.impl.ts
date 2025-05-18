import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/database/prisma/prisma.service';
import { BaseRepository } from 'src/shared/repo/base.repository';
import { EventCategories, Prisma } from '@prisma/client';
import { EventCategoriesRepository } from './eventCategories.repo';

@Injectable()
export class EventCategoriesRepositoryImpl
  extends BaseRepository<EventCategories, Prisma.EventCategoriesDelegate>
  implements EventCategoriesRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.eventCategories, prisma);
  }
}