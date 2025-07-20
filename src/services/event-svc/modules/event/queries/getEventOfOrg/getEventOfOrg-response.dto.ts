import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";

export class EventOrgFrontDisplayDto {
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

  @ApiProperty({ example: true, description: 'Event is approved' })
  isApproved: boolean;

  @ApiProperty({ example: 0, description: 'User role in this event (0 = Organizer)' })
  role: number;

  @ApiProperty({ example: true, description: 'has showing in futre' })
  isHasShowingInFuture: boolean;
}

export class EventOrgFrontDisplayResponse extends BaseResponse {
  @ApiProperty({ type: [EventOrgFrontDisplayDto], description: 'List of events' })
  data: EventOrgFrontDisplayDto[];
}