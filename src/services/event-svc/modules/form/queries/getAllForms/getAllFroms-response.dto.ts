import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class FormInputDto {
  @ApiProperty({ example: 9, description: 'Input field ID' })
  id: number;

  @ApiProperty({ example: 'Enter your name', description: 'Field name' })
  fieldName: string;

  @ApiProperty({ example: 'text', description: 'Input type (e.g., text, select)' })
  type: string;

  @ApiProperty({ example: true, description: 'Whether the field is required' })
  required: boolean;

  @ApiProperty({ example: '^[a-zA-Z0-9]+$', description: 'Validation regex (optional)', required: false })
  regex?: string;

  @ApiProperty({ example: null, description: 'Options for select fields (nullable)', required: false })
  options?: any;
}

export class BasicFormDto {
  @ApiProperty({ example: 1, description: 'Form ID' })
  id: number;

  @ApiProperty({ example: 'Registration Form', description: 'Name of the form' })
  name: string;

  @ApiProperty({ example: 'organizer123@gmail.com', description: 'Organizer email who created the form' })
  createdBy: string;

  @ApiProperty({ type: [FormInputDto], description: 'Inputs in the form' })
  FormInput: FormInputDto[];
}

export class GetAllFormsResponseDto extends BaseResponse {
  @ApiProperty({ type: [BasicFormDto], description: 'List of forms' })
  data: {
    forms: BasicFormDto[];
  };
}
