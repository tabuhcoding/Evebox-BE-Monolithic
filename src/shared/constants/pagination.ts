import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class Pagination {
  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number; 
  @ApiProperty({ example: 10, description: 'Number of items per page' })
  limit: number;
  @ApiProperty({ example: 100, description: 'Total number of items' })
  totalItems: number;
  @ApiProperty({ example: 10, description: 'Total number of pages' })
  totalPages: number;
}

export class PaginationQuery {
  @ApiPropertyOptional({ example: 1, description: 'Current page number' })
  page: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Number of items per page' })
  limit: number = 10;

}