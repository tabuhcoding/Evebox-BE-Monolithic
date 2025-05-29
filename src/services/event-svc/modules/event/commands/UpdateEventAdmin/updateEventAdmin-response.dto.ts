import { ApiProperty } from '@nestjs/swagger';

class CategoriesResponseDto {
  @ApiProperty({ example: 1, description: 'The ID of the category' })
  id: number;

  @ApiProperty({ example: 'music', description: 'The name of the category' })
  name: string;
}

export class EventDto {
  @ApiProperty({ example: 22911, description: 'Event ID' })
  id: number;

  @ApiProperty({ example: 'Tech Conference 2025', description: 'Event title' })
  title: string;

  @ApiProperty({ example: 'A technology conference for developers', description: 'Event description' })
  description: string;

  @ApiProperty({ example: 'organizer@example.com', description: 'Organizer email' })
  organizerId: string;

  @ApiProperty({ example: 1, description: 'Location ID' })
  locationId: number;

  @ApiProperty({ example: 1, description: 'Logo image ID' })
  imgLogoId: number;

  @ApiProperty({ example: 1, description: 'Poster image ID' })
  imgPosterId: number;

  @ApiProperty({ example: '2024-12-28T13:00:00.000Z', description: 'Event createdAt in ISO format' })
  createdAt: Date;

  @ApiProperty({ example: false, description: 'Is only on eve' })
  isOnlyOnEve: boolean;

  @ApiProperty({ example: false, description: 'Is special' })
  isSpecial: boolean;

  @ApiProperty({ example: false, description: 'Is special for category' })
  isSpecialForCategory: boolean;

  @ApiProperty({ example: 50, description: 'Last score' })
  lastScore: number;

  @ApiProperty({ example: 601, description: 'Total clicks' })
  totalClicks: number;

  @ApiProperty({ example: 300, description: 'Weekly clicks' })
  weekClicks: number;

  @ApiProperty({ example: 'San khau Thien Dang', description: 'Venue' })
  venue: string;

  @ApiProperty({ example: false, description: 'Is approved' })
  isApproved: boolean;

  @ApiProperty({ example: 'Nha hat kich Sai Gon', description: 'Organizer Name' })
  orgName: string;

  @ApiProperty({ example: 'Thanh lap nam 2010', description: 'Organizer Description' })
  orgDescription: string;

  @ApiProperty({ example: 'Su kien online hay offline', description: 'Form of event' })
  isOnline: boolean

  @ApiProperty({ type: [CategoriesResponseDto], description: 'Categories of the event' })
  categories: CategoriesResponseDto[];
}

export class EventResponse {
  @ApiProperty({ example: 200, description: 'Status code' })
  statusCode: number;

  @ApiProperty({ example: 'Event updated successfully', description: 'Message' })
  message: string;

  @ApiProperty({ type: EventDto, description: 'Event data' })
  data: EventDto;
}