import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";

export class CreateShowingResponseDto extends BaseResponse {
  @ApiProperty({ example: '1', description: 'Id of created showing' })
  showingId: string;
}