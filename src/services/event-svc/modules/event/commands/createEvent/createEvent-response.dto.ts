import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";

export class CreateEventResponseData {
  @ApiProperty({ example: 22911, description: 'Id of created event' })
  id: number;
}

export class CreateEventResponseDto extends BaseResponse {
  @ApiProperty({ type: CreateEventResponseData, description: 'Created event data' })
  data: CreateEventResponseData;
}