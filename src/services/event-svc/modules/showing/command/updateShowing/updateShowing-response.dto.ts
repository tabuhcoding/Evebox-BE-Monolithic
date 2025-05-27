import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class UpdateShowingResponseDto extends BaseResponse {
  @ApiProperty({ example: '1', description: 'Updated showing id' })
  showingId: string;
}