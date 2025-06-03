import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateOrgPaymentInfoDto {
  @ApiPropertyOptional({ example: 'Nguyen Van A', description: 'Account name' })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiPropertyOptional({ example: '123456789', description: 'Account number' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'Techcombank', description: 'Bank name' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: 'HCM Branch', description: 'Branch' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({ example: 1, description: 'Business type (1: Cá nhân, 2: Doanh nghiệp/Tổ chức)' })
  @IsOptional()
  @IsNumber()
  businessType?: number;

  @ApiPropertyOptional({ example: 'Nguyen Van A', description: 'Full name (required if businessType=2)' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: '123 ABC Street, HCMC', description: 'Address (required if businessType=2)' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '0101234567', description: 'Tax code (required if businessType=2)' })
  @IsOptional()
  @IsString()
  taxCode?: string;
}