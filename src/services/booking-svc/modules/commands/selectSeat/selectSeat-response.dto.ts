import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class SelectSeatResponseDto extends BaseResponse {

  @ApiProperty({ example: true, description: 'Available seat status'})
  data: boolean;
  
}