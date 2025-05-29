import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsDateString, IsIn, IsBoolean, IsNumber, ValidateIf, IsUrl } from 'class-validator';

export class UpdateTicketTypeDto {
  @ApiPropertyOptional({ example: 'BOOK_NOW', description: 'Ticket status' })
  @IsString({ message: 'Ticket status must be a string' })
  @IsIn(['SOLD_OUT', 'REGISTER_NOW', 'BOOK_NOW', 'REGISTER_CLOSED', 'SALE_CLOSED', 'NOT_OPEN'], { message: 'Ticket status must be either ACTIVE or INACTIVE' })
  status?: string;

  @ApiPropertyOptional({ example: 'vip', description: 'Ticket type' })
  @IsOptional()
  @IsString({ message: 'Ticket type must be a string' })
  name?: string;

  @ApiPropertyOptional({ example: 'Tang kem bap nuoc', description: 'Ticket description' })
  @IsOptional()
  @IsString({ message: 'Ticket description must be a string' })
  description?: string;

  @ApiPropertyOptional({ example: "#000000", description: 'Ticket color' })
  @IsOptional()
  @IsString({ message: 'Ticket color must be a string' })
  color?: string;

  @ApiPropertyOptional({ example: true, description: 'Ticket is Free' })
  @IsOptional()
  @IsBoolean({ message: 'Ticket is Free must be a boolean' })
  isFree?: boolean;

  @ApiPropertyOptional({ example: 100000, description: 'Ticket price' })
  @IsOptional()
  @IsNumber({}, { message: 'Ticket price must be a number' })
  originalPrice?: number;

  @ApiPropertyOptional({ example: '2024-08-01T00:00:00.000Z', description: 'Ticket startTime' })
  @IsOptional()
  @IsDateString(undefined, { message: 'Ticket startTime must be a valid ISO date string' })
  startTime?: string;

  @ApiPropertyOptional({ example: '2024-08-01T00:00:00.000Z', description: 'Ticket endTime' })
  @IsOptional()
  @IsDateString(undefined, { message: 'Ticket endTime must be a valid ISO date string' })
  @ValidateIf((o) => o.startTime && o.endTime, { message: 'End time must be greater than start time' })
  endTime?: string;

  @ApiPropertyOptional({ example: 1, description: 'Ticket Position' })
  @IsOptional()
  @IsNumber({}, { message: 'Ticket position must be a number' })
  position?: number;

  @ApiPropertyOptional({ example: 50, description: 'Ticket Quantity' })
  @IsOptional()
  @IsNumber({}, { message: 'Ticket quantity must be a number' })
  quantity?: number;

  @ApiPropertyOptional({ example: 8, description: 'Max ticket per order' })
  @IsOptional()
  @IsNumber({}, { message: 'Max ticket per order must be a number' })
  maxQtyPerOrder?: number;

  @ApiPropertyOptional({ example: 1, description: 'Min ticket per order' })
  @IsOptional()
  @IsNumber({}, { message: 'Min ticket per order must be a number' })
  minQtyPerOrder?: number;

  @ApiPropertyOptional({ example: 'https://example.com/image.png', description: 'Image URL for the ticket' })
  @IsUrl({}, { message: 'Invalid URL format for image URL' })
  imageUrl?: string;

  @ApiPropertyOptional({ example: false, description: 'Ticket is active' })
  @IsOptional()
  @IsBoolean({ message: 'Ticket is active must be a boolean' })
  isHidden?: boolean;
}