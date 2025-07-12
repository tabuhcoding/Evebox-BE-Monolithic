import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";

export class CheckInTicketResponseData {
  @ApiProperty({ example: '13803fad-61ac-46e9-a061-3eb689dba398', description: 'Checked in ticket id' })
  id: string;

  @ApiProperty({ example: '12345678-1234-1234-1234-123456789012', description: 'The id of the ticketType' })
  ticketTypeId: string;

  @ApiProperty({ example: 'VIP Seat', description: 'The name of the ticket type' })
  ticketTypeName?: string;

  @ApiProperty({ example: 24182, description: 'The id of the seat' })
  seatId?: number;

  @ApiProperty({ example: 323192, description: 'The sectionId of the seat' })
  sectionId?: number;

  @ApiProperty({ example: 'L8', description: 'The seat name' })
  seatName?: string;

  @ApiProperty({ example: 'Section A', description: 'The section name' })
  sectionName?: string;
}

export class CheckInTicketResponseDto extends BaseResponse {
  @ApiProperty({ type: CheckInTicketResponseData })
  data: CheckInTicketResponseData
}