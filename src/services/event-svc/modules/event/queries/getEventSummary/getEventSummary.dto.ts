import { ApiProperty } from "@nestjs/swagger";

export class GetSummaryWithAI {
  @ApiProperty({
    description: 'User query',
    required: false,
  })
  query: string
}