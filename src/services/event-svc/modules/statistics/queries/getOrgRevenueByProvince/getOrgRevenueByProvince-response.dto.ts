import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";

export class ProvinceRevenueData {
  @ApiProperty({ example: "TP.HCM", description: "Province name" })
  provinceName: string;

  @ApiProperty({ example: 100, description: "Number of events" })
  eventCount: number;

  @ApiProperty({ example: 300, description: "Number of showings" })
  showingCount: number;

  @ApiProperty({ example: 500000000, description: "Total revenue" })
  totalRevenue: number;
}

export class ProvinceRevenueResponseDto extends BaseResponse {
  @ApiProperty({ type: [ProvinceRevenueData], description: "Revenue list by province" })
  data: ProvinceRevenueData[];
}