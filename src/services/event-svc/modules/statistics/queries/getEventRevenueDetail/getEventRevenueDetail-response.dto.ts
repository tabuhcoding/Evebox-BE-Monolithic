import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";

export class ShowingRevenueData {
  @ApiProperty({ example: "abc123", description: "Showing id" })
  showingId: string;

  @ApiProperty({ example: "2025-06-01T19:00:00.000Z", description: "Start time of the showing" })
  startTime: Date;

  @ApiProperty({ example: "2025-06-01T21:00:00.000Z", description: "End time of the showing" })
  endTime: Date;

  @ApiProperty({ example: 5000000, description: "Total revenue of the showing" })
  revenue: number;
}

export class EventRevenueDetailResponseDto extends BaseResponse {
  @ApiProperty({ type: [ShowingRevenueData], description: "Showing revenue list in the event" })
  data: ShowingRevenueData[];
}