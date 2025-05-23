import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Old password',
    example: 'oldPassWord@123'
  })
  @IsString()
  oldPassword: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewPass@123',
  })
  @IsString()
  newPassword: string;

  @ApiProperty({
    description: 'Confirm new password',
    example: 'NewPass123!',
  })
  @IsString()
  confirmPassword: string;
}