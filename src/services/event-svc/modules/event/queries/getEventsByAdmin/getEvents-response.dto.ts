import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";
import { Pagination } from "src/shared/constants/pagination";

class CategoriesResponseDto {
  @ApiProperty( { example: 1 , description: 'The ID of the category' })
  id: number;

  @ApiProperty( { example: 'music' , description: 'The name of the category' })
  name: string;
}

export class EventAdminDataDto {
  @ApiProperty({ example: 22911, description: 'Event ID' })
  id: number;

  @ApiProperty({
    example: 'SÂN KHẤU / ĐOÀN CẢI LƯƠNG THIÊN LONG - CAO QUÂN BẢO ĐẠI CHIẾN DƯ HỒNG (LƯU KIM ĐÍNH)',
    description: 'Event title',
  })
  title: string;

  @ApiProperty({
    example: '2024-12-28T13:00:00.000Z',
    description: 'Event created date in ISO format'
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-12-28T13:00:00.000Z',
    description: 'Event deleted at date in ISO format',
  })
  deleteAt: Date;

  @ApiProperty({ description: 'Event logo image' })
  imgLogoUrl: string;

  @ApiProperty({ description: 'Event poster image' })
  imgPosterUrl: string;

  @ApiProperty({ example: '12 duong 3/2', description: 'Event address' })
  locationString: string;

  @ApiProperty({ example: 'Nha hat Ben Thanh', description: 'Event venue' })
  venue: string;

  @ApiProperty({ example: 'dattruong01082@gmail.com', description: 'Organizer email' })
  organizerId: string;

  @ApiProperty({ example: 'dattruong01082@gmail.com', description: 'Admin email' })
  manageBy: string;

  @ApiProperty({ example: true, description: 'Can manage event' })
  canManage: boolean;

  @ApiProperty({ example: true, description: 'Event is approved' })
  isApproved: boolean;

  @ApiProperty({ example: true, description: 'Event is special' })
  isSpecial: boolean;

  @ApiProperty({ example: true, description: 'Event is only on EveBox' })
  isOnlyOnEve: boolean;

  @ApiProperty({ example: true, description: 'Event is online or offline' })
  isOnline: boolean;

  @ApiProperty({ type: [CategoriesResponseDto], description: 'List categories of event' })
  categories: CategoriesResponseDto[]
}

export class EventDataResponse extends BaseResponse {
  @ApiProperty({ type: [EventAdminDataDto], description: 'List of events' })
  data: EventAdminDataDto[];

  @ApiProperty({ type: Pagination, description: 'Pagination information' })
  pagination: Pagination;
}