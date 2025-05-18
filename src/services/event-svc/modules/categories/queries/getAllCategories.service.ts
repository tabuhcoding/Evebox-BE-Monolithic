import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { CategoriesRepository } from 'src/services/event-svc/repository/categories/categories.repo';
import { CategoriesResponseDto } from './getAllCategories-response.dto';

@Injectable()
export class GetAllCategoriesService {
  constructor(
    @Inject('CategoriesRepository') private readonly categoriesRepository: CategoriesRepository,
  ) {}

  async findAll(): Promise<Result<CategoriesResponseDto[], Error>> {

    try {
      const categories = await this.categoriesRepository.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return Ok(categories);
    } catch (error) {
      return Err(new Error('Failed to retrieve categories'));
    }
  }
}
