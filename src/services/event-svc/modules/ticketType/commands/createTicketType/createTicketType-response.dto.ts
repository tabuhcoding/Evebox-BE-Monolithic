import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";

export class CreateTicketTypeResponseDto extends BaseResponse {
  @ApiProperty({ example: '1', description: 'ticketType id' })
  ticketTypeId: string;
}