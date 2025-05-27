import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, ValidateIf } from 'class-validator';

export class UpdateShowingDto {
  @ApiProperty({ example: '2021-08-01T00:00:00.000Z', description: 'Showing startTime' })
  @IsOptional()
  @IsDateString(undefined, { message: 'Showing startTime must be a valid ISO date string' })
  startTime?: string;

  @ApiProperty({ example: '2021-08-01T00:00:00.000Z', description: 'Showing endTime' })
  @IsOptional()
  @IsDateString(undefined, { message: 'Showing endTime must be a valid ISO date string' })
  @ValidateIf((o) => new Date(o.endTime) > new Date(o.startTime), { message: 'End time must be greater than start time' })
  endTime?: string;
}