import { ApiProperty } from "@nestjs/swagger";

export class ContentDto {
  @ApiProperty()
  context: string;

  @ApiProperty()
  message?: string;

  @ApiProperty()
  rootId?: number;
}