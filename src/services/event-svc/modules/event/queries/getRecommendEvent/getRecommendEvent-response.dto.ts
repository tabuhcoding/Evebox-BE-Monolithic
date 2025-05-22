import { BaseResponse } from "src/shared/constants/baseResponse";
import {EventFrontDisplayDto} from "../getEventFrontDisplay/getEventFrontDisplay-response.dto";

import {ApiProperty} from "@nestjs/swagger";


export class GetRecommendEventResponse extends BaseResponse {
  @ApiProperty({ type: [EventFrontDisplayDto], description: 'GetEventFDByIdsResponse' })
  data: EventFrontDisplayDto[];
}