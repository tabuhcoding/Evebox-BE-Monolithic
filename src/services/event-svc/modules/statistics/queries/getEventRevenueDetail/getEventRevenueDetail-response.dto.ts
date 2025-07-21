import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";
import { ShowingRevenueData } from "../getOrgRevenue/getOrgRevenue-response.dto";

export class EventRevenueWithInfoData {
  @ApiProperty( {example: 'The Batman', description: 'The title of the event' })
  title: string;

  @ApiProperty( {example: 'Nhà hát kịch Idecaf', description: 'The venue of the event' })
  venue: string;

  @ApiProperty( {example: '130 Nguyen Dinh Chieu, Da Kao Ward, District 1, Ho Chi Minh City', description: 'The address of the event' })
  locationsString: string;
  
  showings: ShowingRevenueData[];
}

export class EventRevenueDetailResponseDto extends BaseResponse {
  @ApiProperty({ type: EventRevenueWithInfoData, description: "Event revenue" })
  data: EventRevenueWithInfoData;
}