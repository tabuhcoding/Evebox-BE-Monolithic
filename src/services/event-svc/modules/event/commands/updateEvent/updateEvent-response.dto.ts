import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";

export class UpdateEventResponseData {
  @ApiProperty({ example: 22911, description: 'Id of updated event' })
  id: number;

  @ApiProperty({ example: true, description: 'Indicates if the event update is approved' })
  isApproved: boolean;

  @ApiProperty({ example: "ABCSDNA", description: 'Signmessage to confirm the update' })
  signMessage?: string;

  @ApiProperty({ example: "Your update contains sensitive words", description: 'Message to check the update' })
  checkMessage?: string;
}

export class UpdateEventResponseDto extends BaseResponse {
  @ApiProperty({ type: UpdateEventResponseData, description: 'Updated event data' })
  data: UpdateEventResponseData;
}