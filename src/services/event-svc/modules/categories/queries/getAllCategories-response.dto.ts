import { ApiProperty } from "@nestjs/swagger";


export class CategoriesResponseDto {
  @ApiProperty( { example: 1 , description: 'The ID of the category' })
  id: number;

  @ApiProperty( { example: 'Nature' , description: 'The name of the category' })
  name: string;

  @ApiProperty( { example: '2021-09-01T00:00:00.000Z' , description: 'The date the category was created' })
  createdAt: Date;
}

export class CategoriesResponse {
  @ApiProperty( { example: 200 , description: 'The status code of the response' })
  statusCode: number;

  @ApiProperty( { example: 'Categories retrieved successfully' , description: 'The status message of the response' })
  message: string;

  @ApiProperty( { type: [CategoriesResponseDto] , description: 'The data of the response' })
  data: CategoriesResponseDto[];
}