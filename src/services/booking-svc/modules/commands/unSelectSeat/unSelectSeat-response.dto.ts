import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class UnSelectSeatResponseDto extends BaseResponse {

  @ApiProperty({ example: true, description: 'UnSelectSeat status'})
  data: boolean;
  
}