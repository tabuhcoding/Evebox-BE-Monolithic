import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class UserPinStatusData {
  @ApiProperty({ example: true })
  requiresPinSetup?: boolean;
  
  @ApiProperty({ example: true })
  requiresPinVerification?: boolean;
  
  @ApiProperty({ example: 2, required: false })
  remainingAttempts?: number;

  @ApiProperty({ example: '20/11/2026', required: false })
  lockedUntil?: Date;
}

export class UserPinStatusResponse extends BaseResponse {
  @ApiProperty({
    type: () => UserPinStatusData,
  })
  data: UserPinStatusData;
}