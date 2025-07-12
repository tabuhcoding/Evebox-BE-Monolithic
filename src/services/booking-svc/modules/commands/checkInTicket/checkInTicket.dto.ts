import { ApiProperty } from "@nestjs/swagger";

export class CheckInTicketDto {
  @ApiProperty({ example: 123213, description: 'Event id of the ticket' })
  eventId: number;
}