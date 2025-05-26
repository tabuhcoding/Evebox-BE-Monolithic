import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";

export class DeleteEventResponseData {
  @ApiProperty({ example: 22911, description: 'Id of deleted event' })
  id: number;
}

export class DeleteEventResponseDto extends BaseResponse {
  @ApiProperty({ type: DeleteEventResponseData, description: 'Deleted event response' })
  data: DeleteEventResponseData;
}