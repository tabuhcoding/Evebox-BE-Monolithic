import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class CreateOrgPaymentInfoData {
  @ApiProperty({ example: 'abc123', description: 'Organizer payment info id' })
  id: string;

  @ApiProperty({ example: '2024-06-01T10:00:00.000Z', description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-06-01T10:00:00.000Z', description: 'Updated at timestamp' })
  updatedAt: Date;

  @ApiProperty({ example: false, description: 'Is deleted flag' })
  isDeleted: boolean;

  @ApiProperty({ example: 'organizer-456', description: 'Organizer id' })
  organizerId: string;

  @ApiProperty({ example: 'Nguyen Van A', description: 'Account name' })
  accountName: string;

  @ApiProperty({ example: '123456789', description: 'Account number' })
  accountNumber: string;

  @ApiProperty({ example: 'Vietcombank', description: 'Bank name' })
  bankName: string;

  @ApiProperty({ example: 'Hanoi', description: 'Bank branch' })
  branch: string;

  @ApiProperty({ example: 1, description: 'Business type' })
  businessType: number;

  @ApiProperty({ example: 'Nguyen Van A', description: 'Full name of organizer' })
  fullName: string;

  @ApiProperty({ example: '123 Lê Lợi, Quận 1, TP.HCM', description: 'Organizer address' })
  address: string;

  @ApiProperty({ example: '1234567890', description: 'Tax code' })
  taxCode: string;
}

export class CreateOrgPaymentInfoResponseDto extends BaseResponse {
  @ApiProperty({ example: 'd1f6f89e-5b77-4e57-9f1a-123456789abc', description: 'Created OrgPaymentInfo id' })
  data: {
    id: string;
  }
}
