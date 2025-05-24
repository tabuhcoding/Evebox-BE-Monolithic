import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TurnOffNotificationDto {
  @ApiProperty({ example: '123', description: 'Org ID as string' })
  @IsNotEmpty()
  @IsString()
  orgId: string;
}

class TurnOffNotificationResponseData {
  @ApiProperty({ example: true })
  success: boolean;
}

export class TurnOffNotificationResponse {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Notification turned off successfully' })
  message: string;

  @ApiProperty({ type: TurnOffNotificationResponseData })
  data: TurnOffNotificationResponseData;
}
