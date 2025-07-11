import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class RevenueByTicketPriceData {
  @ApiProperty({ example: 100000 })
  minPrice: number;

  @ApiProperty({ example: 200000 })
  maxPrice: number;

  @ApiProperty({ example: 300 })
  total: number;

  @ApiProperty({ example: 270 })
  sold: number;

  @ApiProperty({ example: 0.9 })
  conversionRate: number;

  @ApiProperty({ example: 27000000 })
  revenue: number;
}

export class RevenueByTicketPriceResponseDto extends BaseResponse {
  @ApiProperty({ type: [RevenueByTicketPriceData] })
  data: RevenueByTicketPriceData[];
}