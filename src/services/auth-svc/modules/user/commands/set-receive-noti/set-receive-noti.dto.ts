import { ApiProperty } from '@nestjs/swagger';
import { IsBooleanString } from 'class-validator';

export class SetReceiveNotiQueryDto {
  @ApiProperty({
    example: 'true',
    description: 'Whether the user wants to receive notifications (true or false)',
  })
  @IsBooleanString()
  isReceived: string;
}

class SetReceiveNotiResponseData {
  @ApiProperty({ example: true, description: 'Whether the update was successful' })
  success: boolean;
}

export class SetReceiveNotiResponse {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Notification preference updated successfully' })
  message: string;

  @ApiProperty({ type: SetReceiveNotiResponseData })
  data: SetReceiveNotiResponseData;
}
