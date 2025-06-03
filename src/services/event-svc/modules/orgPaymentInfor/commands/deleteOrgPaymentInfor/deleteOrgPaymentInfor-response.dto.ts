import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class DeleteOrgPaymentInfoResponseDto extends BaseResponse {
  @ApiProperty({ example: 'd1f6f89e-5b77-4e57-9f1a-123456789abc', description: 'ID of the deleted OrgPaymentInfo' })
  data: { id: string };
}