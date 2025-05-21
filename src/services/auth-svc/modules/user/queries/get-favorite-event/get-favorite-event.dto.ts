import { ApiProperty } from '@nestjs/swagger';

class EventImage {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  imageUrl: string;
}

export class FavoriteEventResponseData {
  @ApiProperty({ example: 22911 })
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  startDate: string;

  @ApiProperty({ type: EventImage })
  Images_Events_imgLogoIdToImages: EventImage;

  @ApiProperty({ type: EventImage })
  Images_Events_imgPosterIdToImages: EventImage;

  @ApiProperty()
  venue: string;
}

export class GetFavoriteEventResponse {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Get favorite events successfully' })
  message: string;

  @ApiProperty({ type: [FavoriteEventResponseData] })
  data: FavoriteEventResponseData[];
}
