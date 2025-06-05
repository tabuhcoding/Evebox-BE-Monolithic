import { ApiProperty } from "@nestjs/swagger";
import { Length } from "class-validator";

export class CreatePinUserDto {
  @ApiProperty({ example: '123456', description: 'Pin code(required exactly 6 number)' })
  @Length(6)
  pin: string;
}