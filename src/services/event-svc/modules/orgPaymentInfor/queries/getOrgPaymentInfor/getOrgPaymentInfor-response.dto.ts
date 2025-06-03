import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class OrgPaymentInfoData {
  @ApiProperty({ example: 'd1f6f89e-5b77-4e57-9f1a-123456789abc', description: 'ID of the OrgPaymentInfo' })
  id: string;

  @ApiProperty({ example: 'organizer123', description: 'Organizer ID' })
  organizerId: string;

  @ApiProperty({ example: 'Nguyen Van A', description: 'Account name' })
  accountName: string;

  @ApiProperty({ example: '123456789', description: 'Account number' })
  accountNumber: string;

  @ApiProperty({ example: 'Techcombank', description: 'Bank name' })
  bankName: string;

  @ApiProperty({ example: 'HCM Branch', description: 'Branch' })
  branch: string;

  @ApiProperty({ example: 2, description: 'Business type (1: individual, 2: business/organizer)' })
  businessType: number;

  @ApiProperty({ example: 'Nguyen Van A', description: 'Full name', required: false })
  fullName?: string;

  @ApiProperty({ example: '123 ABC Street, HCMC', description: 'Address', required: false })
  address?: string;

  @ApiProperty({ example: '0101234567', description: 'Tax code', required: false })
  taxCode?: string;

  @ApiProperty({ example: '2023-06-01T10:00:00.000Z', description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ example: '2023-06-10T12:00:00.000Z', description: 'Updated at' })
  updatedAt: Date;
}

export class GetOrgPaymentInfoResponseDto extends BaseResponse {
  @ApiProperty({ type: OrgPaymentInfoData, description: 'OrgPaymentInfo data' })
  data: OrgPaymentInfoData;
}