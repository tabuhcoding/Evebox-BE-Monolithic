import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEmail } from 'class-validator';

export class GetEventMembersQueryDto {
  @ApiPropertyOptional({ example: 'dattruong01082@gmail.com', description: 'Email of organizer' })
  @IsOptional()
  @IsEmail()
  email?: string;
}