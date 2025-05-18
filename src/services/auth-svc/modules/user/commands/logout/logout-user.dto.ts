import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponse {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ 
    example: 'Successfully logged out',
    description: 'Success message'
  })
  message: string;

  @ApiProperty({
    description: 'No data returned',
    example: null,
    type: 'null'
  })
  data: null;
}