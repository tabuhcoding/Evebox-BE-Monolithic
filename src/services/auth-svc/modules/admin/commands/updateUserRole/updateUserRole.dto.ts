import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "../../../user/domain/enums/user-role.enum";
import { IsEnum } from "class-validator";

export class UpdateUserRoleDto {
  @ApiProperty({
    example: 2,
    enum: UserRole,
    description: 'Role User (0=SYSTEM_ADMIN, 1=ADMIN, 2=ORGANIZER, 3=CUSTOMER)'
  })
  @IsEnum(UserRole)
  role: UserRole;
}