import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsDateString, IsBoolean, IsNumber, IsIn } from 'class-validator';
import { isDeepStrictEqual } from 'util';


export class CreateEventDto {
  @ApiProperty({ example: 'Tech Conference 2025', description: 'Title of the event' })
  @IsString({message: 'Title must be a string'})
  name: string;

  @ApiProperty({ example: 'A technology conference for developers', description: 'Event description', required: false })
  @IsString({message: 'Description must be a string'})
  description: string;

  @ApiProperty({ example: true, description: 'Showing Online or Offline' })
  isOnlineEvent: boolean;
  
  @ApiProperty({ example: "10 To Hien Thanh, Phuong Ben Nghe, Quan 1, Ho Chi Minh", description: 'Location String' })
  @IsString()
  location?: string;

  @ApiProperty({ example: "San khau Thien Dang", description: 'Venue String' })
  @IsString()
  venue: string;

  @ApiProperty({ example: 'Nha hat kich Sai Gon', description: 'Organizer Name' })
  @IsString()
  organizer: string;

  @ApiProperty({ example: 'Thanh lap nam 2010', description: 'Organizer Description' })
  @IsString()
  organizerDescription: string;

  @ApiProperty({ example: [1, 2], description: 'Array of category IDs', required: true })
  @IsNumber({}, { each: true })
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  @IsIn ([1, 2, 3, 4])
  categoryIds: number[];
}