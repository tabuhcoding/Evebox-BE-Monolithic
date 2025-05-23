import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Name of the user',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Phone number of the user',
    example: '+1234567890',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Image ID of the user',
    example: 30,
  })
  @IsInt()
  @IsOptional()
  avatar_id?: number;
}