import { IsEmail, IsInt, Min, Max } from 'class-validator';

export class AddEventMemberDto {
  @IsEmail()
  email: string;

  @IsInt()
  @Min(1)
  @Max(6)
  role: number;
}
