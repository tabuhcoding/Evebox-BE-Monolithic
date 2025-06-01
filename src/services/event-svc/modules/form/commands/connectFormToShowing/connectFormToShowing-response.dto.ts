import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class ConnectFormResponseData {
  @ApiProperty({ example: '123123123123', description: 'Showing id' })
  showingId: string;

  @ApiProperty({ example: 132, description: 'Form id' })
  formId: number
}

export class ConnectFormResponseDto extends BaseResponse {
  @ApiProperty({ type: ConnectFormResponseData, description: 'Data containing showingId and connected formId' })
  data: ConnectFormResponseData;
}