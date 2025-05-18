import { Controller, Get, Post, Delete, Body, Param, HttpStatus, Res } from '@nestjs/common';
import { GetAllCategoriesService } from './getAllCategories.service';
import { Response } from 'express';
import { ApiOperation, ApiProperty, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoriesResponse } from './getAllCategories-response.dto';

@ApiTags('Event Service - Categories')
@Controller('api/categories')
export class GetAllCategoriesController {
  constructor(private readonly categoriesService: GetAllCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Categories retrieved successfully', type: CategoriesResponse })
  async findAll(@Res() res: Response) {
    const result = await this.categoriesService.findAll();
    return res.status(HttpStatus.OK).json(result.unwrap());
  }
}
