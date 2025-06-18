import { ApiProperty } from "@nestjs/swagger";
import { PaginationQuery } from "src/shared/constants/pagination";

export enum OrderStatus{
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  CANCELLED = 'CANCELLED',
}

export enum OrderTimeStamp {
  UPCOMING = 'UPCOMING',
  PAST = 'PAST',
}

export class GetUserOrderDto extends PaginationQuery {
  @ApiProperty({
    example: OrderStatus.PENDING,
    description: 'The status of the order. Not provided means all orders',
    enum: OrderStatus,
  })
  status?: OrderStatus;
}