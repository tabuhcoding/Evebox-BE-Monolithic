import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";
import { Pagination } from "src/shared/constants/pagination";
import { UserStatus } from "@prisma/client";

class UserRole {
  @ApiProperty({ example: 1, description: 'User role id' })
  id: number;

  @ApiProperty({ example: 'ADMIN', description: 'User role' })
  role_name: string;
}

export class UserDto {
  @ApiProperty({ example: '17ed7957-2a25-4d3b-bffc-ff8d47cce466', description: 'User id' })
  id: string;

  @ApiProperty({ example: 'Dat Truong', description: 'User name' })
  name: string;

  @ApiProperty({ example: 'dattruong01082@gmail.com', description: 'User email' })
  email: string;

  @ApiProperty({ example: 'ACTIVE', description: 'User status', enum: UserStatus })
  status: string;

  @ApiProperty({ type: UserRole, description: 'User role' })
  role: UserRole;

  @ApiProperty({ example: '2025-03-25T19:17:37.415Z', description: 'User created date' })
  created_at: string;
}


export class UserData {
  @ApiProperty({ type: [UserDto], description: 'List users info' })
  data: UserDto[];

  @ApiProperty({ type: Pagination, description: 'Pagination information' })
  pagination: Pagination;
}

export class UserDataResponse extends BaseResponse {
  @ApiProperty({ type: UserData, description: 'Users get by admins data' })
  data: UserData;
}