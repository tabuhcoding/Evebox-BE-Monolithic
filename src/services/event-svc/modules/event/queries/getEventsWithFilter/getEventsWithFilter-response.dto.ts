import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";
import { EventFrontDisplayDto } from "../getEventFrontDisplay/getEventFrontDisplay-response.dto";
import { Pagination } from "src/shared/constants/pagination";

export class GetEventsWithFilterResponseDto extends BaseResponse {
  @ApiProperty({ type: [EventFrontDisplayDto], description: 'List of events matching the filter criteria' })
  data: EventFrontDisplayDto[];

  @ApiProperty({ type: Pagination, description: 'Pagination information for the events'})
  pagination?: Pagination;
}