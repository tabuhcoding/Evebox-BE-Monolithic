import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ItemType {
  EVENT = 'EVENT',
  ORG = 'ORG',
}

export class CreateFavoriteDto {
  @ApiProperty({
    example: 'EVENT',
    enum: ItemType,
    description: 'Type of the item to favorite (EVENT or ORG)'
  })
  @IsEnum(ItemType)
  itemType: ItemType;

  @ApiProperty({
    example:  'org_abc123',
    description: 'ID of the event or organizer'
  })
  @IsNotEmpty()
  @IsString()
  itemId: string;
}

class CreateFavoriteResponseData {
  @ApiProperty({
    example: true,
    description: 'Indicates if the favorite was added successfully'
  })
  success: boolean;
}

export class CreateFavoriteResponse {
  @ApiProperty({ example: 201 })
  statusCode: number;

  @ApiProperty({
    example: 'Favorite added successfully',
    description: 'Success message'
  })
  message: string;

  @ApiProperty({ type: CreateFavoriteResponseData })
  data: CreateFavoriteResponseData;
}
