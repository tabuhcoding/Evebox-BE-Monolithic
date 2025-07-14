import { ApiProperty } from "@nestjs/swagger";

export class GetAnalyticsWithAI {
  @ApiProperty({
    description: 'User query',
    required: false,
  })
  query: string
}