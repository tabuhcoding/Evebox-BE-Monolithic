import { ApiProperty } from '@nestjs/swagger';

class UnfavoriteEventResponseData {
  @ApiProperty({
    example: true,
    description: 'Indicates if the event was successfully unfavorited'
  })
  success: boolean;
}

export class UnfavoriteEventResponse {
  @ApiProperty({
    example: 200,
    description: 'HTTP status code'
  })
  statusCode: number;

  @ApiProperty({
    example: 'Event unfavorited successfully',
    description: 'Success message'
  })
  message: string;

  @ApiProperty({
    type: UnfavoriteEventResponseData,
    description: 'Payload containing result status'
  })
  data: UnfavoriteEventResponseData;
}
