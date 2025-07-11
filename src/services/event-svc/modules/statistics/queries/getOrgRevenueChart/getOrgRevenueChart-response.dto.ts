import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";

export class RevenueSummaryItem {
  @ApiProperty({
    example: "2024-01",
    description: "The time period for revenue aggregation, formatted as YYYY-MM (monthly) or YYYY (yearly).",
  })
  period: string;

  @ApiProperty({
    example: 150000000,
    description: "Total revenue for the specified time period, in Vietnamese Dong (VND).",
  })
  totalRevenue: number;

  @ApiProperty({
    example: 135000000,
    description: "Actual revenue received after deducting platform fees, in Vietnamese Dong (VND).",
  })
  actualRevenue: number;
}

export class RevenueSummaryResponseDto extends BaseResponse {
  @ApiProperty({
    type: [RevenueSummaryItem],
    description: "List of revenue summaries aggregated by the specified period (month or year).",
  })
  data: RevenueSummaryItem[];
}