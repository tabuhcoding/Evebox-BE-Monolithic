import { ApiProperty } from '@nestjs/swagger';

class UnfavoriteOrgResponseData {
  @ApiProperty({
    example: true,
    description: 'Indicates if the org was successfully unfavorited'
  })
  success: boolean;
}

export class UnfavoriteOrgResponse {
  @ApiProperty({
    example: 200,
    description: 'HTTP status code'
  })
  statusCode: number;

  @ApiProperty({
    example: 'Org unfavorited successfully',
    description: 'Success message'
  })
  message: string;

  @ApiProperty({
    type: UnfavoriteOrgResponseData,
    description: 'Payload containing result status'
  })
  data: UnfavoriteOrgResponseData;
}
