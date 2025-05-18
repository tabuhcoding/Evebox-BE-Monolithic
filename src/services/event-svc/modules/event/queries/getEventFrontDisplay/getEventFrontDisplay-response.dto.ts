import { ApiProperty } from "@nestjs/swagger";
import { Decimal } from "@prisma/client/runtime/library";
import { CategoriesResponseDto } from "../../../categories/queries/getAllCategories-response.dto";
import { EventStatus } from "src/shared/utils/status/status";

export class EventFrontDisplayDto {
  @ApiProperty({ example: 22911, description: 'Event ID' })
  id: number;

  @ApiProperty({
    example: 'SÂN KHẤU / ĐOÀN CẢI LƯƠNG THIÊN LONG - CAO QUÂN BẢO ĐẠI CHIẾN DƯ HỒNG (LƯU KIM ĐÍNH)',
    description: 'Event title',
  })
  title: string;

  @ApiProperty({
    example: '2024-12-28T13:00:00.000Z',
    description: 'Event start date in ISO format',
  })
  startDate: Date;

  @ApiProperty({ example: '50', description: 'Last score' })
  lastScore: Decimal;

  @ApiProperty({ example: 'https://example.com/poster.jpg', description: 'Image poster URL' })
  imgPosterUrl: string;

  @ApiProperty({ example: 'https://example.com/logo.jpg', description: 'Image logo URL' })
  imgLogoUrl: string;

  @ApiProperty({ example: 601, description: 'Total clicks' })
  totalClicks: number;

  @ApiProperty({ example: 300, description: 'Weekly clicks' })
  weekClicks: number;

  @ApiProperty({ example: 1000000, description: 'Minimum ticket price' })
  minTicketPrice?: number;

  @ApiProperty({ example: EventStatus.AVAILABLE, description: 'Event Status' })
  status?: EventStatus;
}

export class EventCategoriesSpectial {
  @ApiProperty( { type: CategoriesResponseDto, description: 'Category' })
  category: CategoriesResponseDto;

  @ApiProperty( { type: [EventFrontDisplayDto], description: 'Events' })
  events: EventFrontDisplayDto[];
}

export class GetEventFrontDisplayDTO {
  @ApiProperty( { type: [EventFrontDisplayDto], description: 'Special events' })
  specialEvents: EventFrontDisplayDto[];

  @ApiProperty( { type: [EventFrontDisplayDto], description: 'Trending events' })
  trendingEvents: EventFrontDisplayDto[];

  @ApiProperty( { type: [EventFrontDisplayDto], description: 'Only on eve events' })
  onlyOnEve: EventFrontDisplayDto[];

  @ApiProperty( { type: [EventCategoriesSpectial], description: 'Categories Special events' })
  categorySpecial: EventCategoriesSpectial[];
}

export class GetEventFrontDisplayResponse {
  @ApiProperty( { example: 200, description: 'Status code' })
  statusCode: number;

  @ApiProperty( { example: 'Front display data retrieved successfully', description: 'Message' })
  message: string;

  @ApiProperty( { type: GetEventFrontDisplayDTO, description: 'Front display data' })
  data: GetEventFrontDisplayDTO;
}