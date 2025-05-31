import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";

export class TicketTypeData {
  @ApiProperty({ example: '1001414', description: 'Ticket type ID' })
  id: string;
}

export class EventData {
  @ApiProperty({ example: '23663', description: 'Event ID' })
  id: number;

  @ApiProperty({ example: 'SÂN KHẤU NO.1 | VỞ KỊCH | MẶT NẠ DA NGƯỜI', description: 'Event title' })
  title: string;
}

export class ShowingDataDto {
  @ApiProperty({ example: '1041811243642', description: 'Showing time ID' })
  id: string;

  @ApiProperty({ example: '2024-12-28T13:00:00.000Z', description: 'Start time of the showing in ISO format' })
  startTime: Date;

  @ApiProperty({ example: '2024-12-28T15:00:00.000Z', description: 'End time of the showing in ISO format' })
  endTime: Date;

  @ApiProperty({ type: [TicketTypeData], description: 'List of ticket types' })
  ticketTypes: TicketTypeData[];

  @ApiProperty({ example: '113', description: 'Seatmap ID' })
  seatmapId: number;

  @ApiProperty({ example: '23663', description: 'Event ID' })
  eventId: number;

  @ApiProperty({ example: 'SÂN KHẤU NO.1 | VỞ KỊCH | MẶT NẠ DA NGƯỜI', description: 'Event title' })
  eventTitle: string;

  @ApiProperty({ type: EventData, description: 'Event data' })
  event: EventData
}

export class ShowingResponseDto extends BaseResponse {
  @ApiProperty({ type: [ShowingDataDto], description: 'List of showing' })
  data: ShowingDataDto[];
}