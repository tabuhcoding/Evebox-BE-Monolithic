import { AREACODE } from "prisma/client-auth";
import { ApiProperty } from "@nestjs/swagger";
import { UserStatus } from "prisma/client-auth";
import { IsEnum } from "class-validator";

export class UpdateUserStatusDto {
  @ApiProperty({
    example: 'ACTIVE',
    description: 'Status User',
  })
  @IsEnum(UserStatus)
  status: UserStatus;
}

export class UpdateAreaAdminDto {
  @ApiProperty({
    example: 'HANOI',
    description: 'area',
  })
  @IsEnum(AREACODE)
  area: AREACODE;
}