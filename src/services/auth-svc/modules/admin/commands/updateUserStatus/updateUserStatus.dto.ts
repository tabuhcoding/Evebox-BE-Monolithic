import { ApiProperty } from "@nestjs/swagger";
import { UserStatus } from "@prisma/client";
import { IsEnum } from "class-validator";

export class UpdateUserStatusDto {
  @ApiProperty({
    example: 'ACTIVE',
    description: 'Status User',
  })
  @IsEnum(UserStatus)
  status: UserStatus;
}