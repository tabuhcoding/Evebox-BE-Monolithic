import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsBoolean, IsNumber, ValidateIf, IsIn, IsUrl } from 'class-validator';


export class CreateTicketTypeDto {
  @ApiProperty({ example: 'BOOK_NOW', description: 'Ticket status' })
  @IsString({ message: 'Ticket status must be a string' })
  @IsIn(['SOLD_OUT', 'REGISTER_NOW', 'BOOK_NOW', 'REGISTER_CLOSED', 'SALE_CLOSED', 'NOT_OPEN'], { message: 'Ticket status must be either ACTIVE or INACTIVE' })
  status: string;

  @ApiProperty({ example: 'vip', description: 'Ticket type' })
  @IsString({ message: 'Ticket type must be a string' })
  name: string;

  @ApiProperty({ example: 'Tang kem bap nuoc', description: 'Ticket description' })
  @IsString({ message: 'Ticket description must be a string' })
  description: string;

  @ApiProperty({ example: "#000000", description: 'Ticket color' })
  @IsString({ message: 'Ticket color must be a string' })
  color: string;

  @ApiProperty({ example: 'true', description: 'Ticket is Free' })
  @IsBoolean({ message: 'Ticket is Free must be a boolean' })
  isFree: boolean;

  @ApiProperty({ example: '100000', description: 'Ticket price' })
  @IsNumber({}, { message: 'Ticket price must be a number' })
  originalPrice: number;

  @ApiProperty({ example: '2024-08-01T00:00:00.000Z', description: 'Ticket startTime' })
  @IsDateString(undefined, { message: 'Ticket date must be a string' })
  startTime: string;

  @ApiProperty({ example: '2024-08-15T00:00:00.000Z', description: 'Ticket endTime' })
  @IsDateString(undefined, { message: 'Ticket date must be a string' })
  @ValidateIf((o) => new Date(o.endTime) > new Date(o.startTime), { message: 'End time must be greater than start time' })
  endTime: string;

  @ApiProperty({ example: 1, description: 'Ticket Position' })
  @IsNumber({}, { message: 'Ticket position must be a number' })
  position: number;

  @ApiProperty({ example: 50, description: 'Ticket Quantity' })
  @IsNumber({}, { message: 'Ticket quantity must be a number' })
  quantity?: number;

  @ApiProperty({ example: 8, description: 'Max ticket per order' })
  @IsNumber({}, { message: 'Max ticket per order must be a number' })
  maxQtyPerOrder: number;

  @ApiProperty({ example: 1, description: 'Min ticket per order' })
  @IsNumber({}, { message: 'Min ticket per order must be a number' })
  minQtyPerOrder: number;

  @ApiProperty({ example: 'https://example.com/image.png', description: 'Image URL for the ticket' })
  @IsUrl({}, { message: 'Invalid URL format for image URL' })
  imageUrl: string;

  @ApiProperty({ example: false, description: 'Ticket is active' })
  @IsBoolean({ message: 'Ticket is active must be a boolean' })
  isHidden?: boolean;
}