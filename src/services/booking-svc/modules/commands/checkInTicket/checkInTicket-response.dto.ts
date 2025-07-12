import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";

export class CheckInTicketResponseData {
  @ApiProperty({ example: '13803fad-61ac-46e9-a061-3eb689dba398', description: 'Checked in ticket id' })
  id: string;
}

export class CheckInTicketResponseDto extends BaseResponse {
  @ApiProperty({ type: CheckInTicketResponseData })
  data: CheckInTicketResponseData
}