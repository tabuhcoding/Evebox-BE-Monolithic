import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/database/prisma/prisma.service';
import { BaseRepository } from 'src/shared/repo/base.repository';
import { Categories, Prisma } from '@prisma/client';
import { CategoriesRepository } from './categories.repo';

@Injectable()
export class CategoriesRepositoryImpl 
extends BaseRepository<Categories, Prisma.CategoriesDelegate>
implements CategoriesRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.categories, prisma);
  }
}