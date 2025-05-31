import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class DeleteFormResponseDto extends BaseResponse {
  @ApiProperty({ example: 1, description: 'ID of the deleted form' })
  data: { formId: number };
}