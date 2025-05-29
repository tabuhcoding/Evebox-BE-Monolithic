import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsNumber, IsIn, IsBoolean } from 'class-validator';

export class UpdateEventAdminDto {
  @ApiProperty({ example: false, description: 'Is this event special?' })
  @IsOptional()
  isSpecial?: string | boolean | null;

  @ApiProperty({ example: true, description: 'Is this event only on EveBox?' })
  @IsOptional()
  isOnlyOnEve?: string | boolean | null;

  @ApiProperty({ example: true, description: 'Is this event special for category?' })
  @IsOptional()
  isSpecialForCategory?: boolean;

  @ApiProperty({ example: true, description: 'Is this event approved?' })
  @IsOptional()
  isApproved?: string | boolean | null;

  @ApiPropertyOptional({ example: [1, 2], description: 'Array of category IDs' })
  @IsOptional()
  @IsNumber({}, { each: true })
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  @IsIn([1, 2, 3, 4], { each: true })
  categoryIds?: number[];
}