import { Injectable } from '@nestjs/common';
import { PrismaEventService } from '../../database/prisma-event/prisma.service';
import { BaseEventRepository } from '../base.repository';
import { Categories, Prisma } from 'prisma/client-event';
import { CategoriesRepository } from './categories.repo';

@Injectable()
export class CategoriesRepositoryImpl 
extends BaseEventRepository<Categories, Prisma.CategoriesDelegate>
implements CategoriesRepository {
  constructor(protected readonly prisma: PrismaEventService) {
    super(prisma.categories, prisma);
  }
}