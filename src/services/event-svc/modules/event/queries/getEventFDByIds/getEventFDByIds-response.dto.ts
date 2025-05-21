import { BaseResponse } from "src/shared/constants/baseResponse";
import {EventFrontDisplayDto} from "../getEventFrontDisplay/getEventFrontDisplay-response.dto";

import {ApiProperty} from "@nestjs/swagger";

export class GetEventFDByIdsResponseDto {
  @ApiProperty({ type: [EventFrontDisplayDto], description: 'Event' })
  event: EventFrontDisplayDto[];
}

export class GetEventFDByIdsResponse extends BaseResponse {
  @ApiProperty({ type: GetEventFDByIdsResponseDto, description: 'GetEventFDByIdsResponse' })
  data: GetEventFDByIdsResponseDto;
}