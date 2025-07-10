import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateEventDto {
  @ApiPropertyOptional({ example: 'Tech Conference 2025', description: 'Title of the event' })
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  title?: string;

  @ApiProperty({ example: 'Online', description: 'Showing Online or Offline' })
  @IsOptional()
  @IsString({ message: 'Showing type must be a string' })
  isOnline?: string | boolean | null;

  @ApiPropertyOptional({ example: 'A technology conference for developers', description: 'Event description' })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiPropertyOptional({ example: 1, description: 'District ID' })
  @IsOptional()
  @IsNumber()
  districtId?: number;

  @ApiPropertyOptional({ example: 'Phuong 3', description: 'Ward String' })
  @IsOptional()
  @IsString()
  wardString?: string;

  @ApiPropertyOptional({ example: '10 To Hien Thanh', description: 'Location String' })
  @IsOptional()
  @IsString()
  streetString?: string;

  @ApiPropertyOptional({ example: 'San khau Thien Dang', description: 'Venue String' })
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional({ example: 'Nha hat kich Sai Gon', description: 'Organizer Name' })
  @IsOptional()
  @IsString()
  orgName?: string;

  @ApiPropertyOptional({ example: 'Thanh lap nam 2010', description: 'Organizer Description' })
  @IsOptional()
  @IsString()
  orgDescription?: string;

  @ApiPropertyOptional({ example: [1, 2], description: 'Array of category IDs' })
  @IsOptional()
  categoryIds?: number[];

  @ApiPropertyOptional({ example: "https://domain.com/image1.png", description: "Event logo URL" })
  @IsOptional()
  @IsString()
  imgLogoUrl?: string;

  @ApiPropertyOptional({ example: "https://domain.com/image2.png", description: "Event poster URL" })
  @IsOptional()
  @IsString()
  imgPosterUrl?: string;

  @ApiProperty({ example: "ABCSDNA", description: 'Signmessage to confirm the update' })
  signMessage?: string;
}