import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";

export class UpdateEventResponseData {
  @ApiProperty({ example: 22911, description: 'Id of updated event' })
  id: number;
}

export class UpdateEventResponseDto extends BaseResponse {
  @ApiProperty({ type: UpdateEventResponseData, description: 'Updated event data' })
  data: UpdateEventResponseData;
}