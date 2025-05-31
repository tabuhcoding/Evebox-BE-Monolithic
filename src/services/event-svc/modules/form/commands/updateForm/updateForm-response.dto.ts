import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class UpdateFormResponseDto extends BaseResponse {
  @ApiProperty({ example: 1, description: 'ID of the updated form' })
  data: { formId: number };
}