import { ApiProperty } from "@nestjs/swagger";
import { TicketTypeSelection } from "../../commands/selectSeat/selectSeat.dto";


export class TicketTypeSelectionCache extends TicketTypeSelection {
  @ApiProperty({ example: 'Bach ngoc', description: 'TicketType Name' })
  ticketTypeName?: string;

  @ApiProperty({ example: 200, description: 'TicketType Price' })
  ticketTypePrice?: number;
}

export class GetRedisSeatResponseData {
  
  @ApiProperty({ example: '16962844867169', description: 'Showing ID' })
  showingId: string;

  @ApiProperty({ example: '1200', description: 'Expired Time, second unit, 1200 mean 1200s = 20m' })
  expiredTime?: number;

  @ApiProperty({ example: 3600, description: 'Total Price' })
  totalAmount?: number;

  @ApiProperty({ type: [TicketTypeSelectionCache], description: 'TicketType Selection' })
  ticketTypeSelection?: TicketTypeSelectionCache[];
}

export class GetRedisSeatResponseDto {
  @ApiProperty({ example: 200, description: 'status code' })
  statusCode: number;

  @ApiProperty({ example: 'Get redis seat successfully', description: 'message' })
  message: string;

  @ApiProperty({ type: GetRedisSeatResponseData, description: 'data' })
  data: GetRedisSeatResponseData;
}