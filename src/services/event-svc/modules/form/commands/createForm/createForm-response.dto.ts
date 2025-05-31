import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";

export class CreateFormResponseDto extends BaseResponse {
  @ApiProperty({ example: '1', description: 'Created form id' })
  formId: string;
}