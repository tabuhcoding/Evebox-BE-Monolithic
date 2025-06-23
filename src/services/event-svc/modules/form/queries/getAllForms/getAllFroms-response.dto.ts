import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class BasicFormDto {
  @ApiProperty({ example: 1, description: 'Form ID' })
  id: number;

  @ApiProperty({ example: 'Registration Form', description: 'Name of the form' })
  name: string;

  @ApiProperty({ example: 'organizer123@gmail.com', description: 'Organizer email who created the form' })
  createdBy: string;
}

export class GetAllFormsResponseDto extends BaseResponse {
  @ApiProperty({ type: [BasicFormDto], description: 'List of forms' })
  data: { 
    forms: BasicFormDto[] 
  };
}