import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class DeleteShowingResponseDto extends BaseResponse {
  @ApiProperty({ example: '1', description: 'Deleted showing id' })
  showingId: string;
}