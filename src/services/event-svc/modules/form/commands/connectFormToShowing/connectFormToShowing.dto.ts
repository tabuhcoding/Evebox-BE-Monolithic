import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class ConnectFormDto {
  @ApiProperty({ example: 'showing123', description: 'Showing ID to connect' })
  @IsString()
  showingId: string;

  @ApiProperty({ example: 1, description: 'Form ID to connect' })
  @IsNumber()
  formId: number;
}