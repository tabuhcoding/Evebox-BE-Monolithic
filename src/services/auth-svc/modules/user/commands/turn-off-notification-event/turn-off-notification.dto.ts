import { ApiProperty } from '@nestjs/swagger';

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
