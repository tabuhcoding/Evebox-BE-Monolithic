import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class StatisticItem {
  @ApiProperty({ example: '2024-04', description: 'Month (format YYYY-MM)' })
  month: string;

  @ApiProperty({ example: 123, description: 'Number of visits in this month' })
  visits: number;
}

export class AnalyticsResponseData {
  @ApiProperty({ example: 123, description: 'Event ID' })
  eventId: number;

  @ApiProperty({ example: 'Sự kiện siêu hot 2024', description: 'Title of the event' })
  eventTitle: string;

  @ApiProperty({ example: 1500, description: 'Total number of clicks for this event' })
  totalClicks: number;

  @ApiProperty({ example: 200, description: 'Number of clicks in the past week' })
  weekClicks: number;

  @ApiProperty({ example: 300, description: 'Total number of unique users who clicked' })
  totalUsers: number;

  @ApiProperty({ example: 1, description: 'Total number of buyers (currently hardcoded)' })
  totalBuyers: number;

  @ApiProperty({ example: 1.0, description: 'Transfer rating (currently hardcoded)' })
  transferRating: number;

  @ApiProperty({ example: 150 })
  totalOrders: number;

  @ApiProperty({ type: [StatisticItem], description: 'Monthly click statistics' })
  statistic: StatisticItem[];
}

export class AnalyticsResponseDto extends BaseResponse {
  @ApiProperty({ type: AnalyticsResponseData })
  data: AnalyticsResponseData;
}

export class AnalyticsAIResponseDto extends BaseResponse {
  @ApiProperty({ description: 'Summary data by AI of an event' })
  data: string;
}