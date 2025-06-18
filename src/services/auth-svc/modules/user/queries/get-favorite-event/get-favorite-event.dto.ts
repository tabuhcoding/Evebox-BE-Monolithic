import { ApiProperty } from '@nestjs/swagger';
import { Pagination } from 'src/shared/constants/pagination';


export class FavoriteEventResponseData {
  @ApiProperty({ example: 22911 })
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  imageUrl: string;

  @ApiProperty()
  description: string;
}

export class GetFavoriteEventResponse {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Get favorite events successfully' })
  message: string;

  @ApiProperty({ type: [FavoriteEventResponseData] })
  data: FavoriteEventResponseData[];

  @ApiProperty({ type: Pagination ,description: 'pagination' })
  pagination: Pagination;
}
