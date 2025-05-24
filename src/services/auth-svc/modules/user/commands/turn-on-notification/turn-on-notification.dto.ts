import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ItemType {
  EVENT = 'EVENT',
  ORG = 'ORG',
}

export class TurnOnNotificationDto {
  @ApiProperty({ enum: ItemType })
  @IsEnum(ItemType)
  itemType: ItemType;

  @ApiProperty({ example: '123' })
  @IsNotEmpty()
  @IsString()
  itemId: string;
}

class TurnOnNotificationResponseData {
  @ApiProperty({ example: true })
  success: boolean;
}

export class TurnOnNotificationResponse {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Notification turned on successfully' })
  message: string;

  @ApiProperty({ type: TurnOnNotificationResponseData })
  data: TurnOnNotificationResponseData;
}
