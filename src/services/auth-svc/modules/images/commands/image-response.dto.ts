import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

class ImagesResponseData {
  @ApiProperty({
    description: 'Image ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Image URL',
    example: 'https://example.com/image.jpg',
  })
  imageUrl: string;
}

export class ImagesResponseDto extends BaseResponse {
  @ApiProperty({
    type: ImagesResponseData,
  })
  data: ImagesResponseData;
}