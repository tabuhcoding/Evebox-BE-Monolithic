import { ApiProperty } from "@nestjs/swagger";
import { EventFrontDisplayDto } from "../getEventFrontDisplay/getEventFrontDisplay-response.dto";

export class GetEventDetailRecommendResponse{
  @ApiProperty({ example: 200, description: 'Status code' })
  statusCode: number;

  @ApiProperty({ example: 'Events retrieved successfully', description: 'Message' })
  message: string;

  @ApiProperty({ type: [EventFrontDisplayDto], description: 'Events data list' })
  data: EventFrontDisplayDto[];
}