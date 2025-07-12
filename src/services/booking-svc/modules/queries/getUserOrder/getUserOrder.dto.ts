import { ApiProperty } from "@nestjs/swagger";
import { PaginationQuery } from "src/shared/constants/pagination";

export enum OrderStatus{
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  CANCELLED = 'CANCELLED',
  GIVEAWAY = 'GIVEAWAY',
}

export enum OrderTimeStamp {
  UPCOMING = 'UPCOMING',
  PAST = 'PAST',
}

export class GetUserOrderDto extends PaginationQuery { 
  @ApiProperty({
    example: OrderTimeStamp.UPCOMING,
    description: 'The time stamp of the order. Not provided means all time stamps',
    enum: OrderTimeStamp,
    required: true,
  })
  timeStamp: OrderTimeStamp;

  @ApiProperty({
    example: OrderStatus.PENDING,
    description: 'The status of the order. Not provided means all orders',
    enum: OrderStatus,
    required: false,
  })
  status?: OrderStatus;

  @ApiProperty({
    example: 'Event Title',
    description: 'The title for filtering orders',
    required: false,
  })
  title?: string;
}