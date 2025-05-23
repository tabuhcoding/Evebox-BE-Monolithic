import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";

export class UpdateUserData {
  @ApiProperty({
    example: 'dattruong01082@gmail.com',
    description: 'User email'
  })
  userEmail: string;

  @ApiProperty({
    example: 'e38511b1-43b5-43af-b973-e6da6d57d00a',
    description: 'User id'
  })
  userId: string;
}

export class UpdateUserResponseDto extends BaseResponse {
  @ApiProperty({ type: UpdateUserData, description: 'Response of update user' })
  data: UpdateUserData;
}