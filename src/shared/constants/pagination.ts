import { ApiProperty } from "@nestjs/swagger";

export class Pagination {
  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number; 
  @ApiProperty({ example: 10, description: 'Number of items per page' })
  limit: number;
  @ApiProperty({ example: 100, description: 'Total number of items' })
  totalItems: number;
  @ApiProperty({ example: 10, description: 'Total number of pages' })
  totalPages: number;

  constructor(
    page: number = 1,
    limit: number = 10,
    totalItems: number = 0,
    totalPages: number = 0
  ) {
    this.page = page;
    this.limit = limit;
    this.totalItems = totalItems;
    this.totalPages = totalPages;
  }
}

export class PaginationQuery {
  @ApiProperty({ example: 1, description: 'Current page number' })
  page?: number;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  limit?: number;

  constructor(page: number = 1, limit: number = 10) {
    this.page = page;
    this.limit = limit;
  }
}