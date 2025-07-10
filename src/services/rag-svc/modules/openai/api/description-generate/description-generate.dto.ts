import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsDateString, IsBoolean, IsNumber, IsIn } from 'class-validator';
import { isDeepStrictEqual } from 'util';


export class EventDescriptionGenDto {
  @ApiProperty({ example: 'Tech Conference 2025', description: 'Title of the event' })
  @IsString({message: 'Title must be a string'})
  name: string;

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

  @ApiProperty({ example: ['Technology', 'Conference'], description: 'Array of category names', required: true })
  @IsString({ each: true })
  categories: string[];
}

export class DescriptionGenerateDTO {
  @ApiProperty({ example: 'evebox-private-key', description: 'Private key for authentication', required: true })
  privatekey?: string

  @ApiProperty({ description: 'Event details for description generation', type: EventDescriptionGenDto, required: true })
  Event: EventDescriptionGenDto;
  
  @ApiProperty({ example: 'A technology conference for developers', description: 'Event description', required: false })
  @IsString({message: 'Description must be a string'})
  description: string;

  @ApiProperty({ example: 'Create a catchy HTML description with at least 2 images', description: 'User request for description generation', required: false })
  @IsString({ message: 'User request must be a string' })
  @IsOptional()
  userRequest?: string;

  @ApiProperty({ example: 'vi', description: 'Language for the description', required: false })
  @IsString({ message: 'Language must be a string' })
  @IsOptional()
  language?: string;

  @ApiProperty({ example: 'event-12345', description: 'Previous event ID for context', required: false })
  @IsString({ message: 'Previous ID must be a string' })
  @IsOptional()
  previousID?: string;
}