import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";
import { OrganizerRevenueData } from "../getOrgRevenue/getOrgRevenue-response.dto";

export class RevenueByIdDto extends BaseResponse {
  @ApiProperty({ type: OrganizerRevenueData, description: "Revenue of org" })
    data: OrganizerRevenueData;
}