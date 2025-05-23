import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";

export class ChangePasswordResponse extends BaseResponse {
  @ApiProperty({
    type: 'object',
    properties: {},
    nullable: true,
    default: null,
  })
  data: null;
}