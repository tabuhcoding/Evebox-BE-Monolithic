import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateOrgPaymentInfoDto {
  @ApiProperty({ example: 'Nguyen Van A', description: 'Account name' })
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @ApiProperty({ example: '123456789', description: 'Account number' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ example: 'Techcombank', description: 'Bank name' })
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiProperty({ example: 'HCM Branch', description: 'Branch' })
  @IsString()
  @IsNotEmpty()
  branch: string;

  @ApiProperty({ example: 1, description: 'Business type (1: individual, 2: business/organizer)' })
  @IsNumber()
  businessType: number;

  @ApiPropertyOptional({ example: 'Nguyen Van A', description: 'Full name (only for red invoice, businessType = 2)' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ example: '123 ABC Street, HCMC', description: 'Address (only for red invoice, businessType = 2)' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: '0101234567', description: 'Tax code (only for red invoice, businessType = 2)' })
  @IsNotEmpty()
  @IsString()
  taxCode: string;
}