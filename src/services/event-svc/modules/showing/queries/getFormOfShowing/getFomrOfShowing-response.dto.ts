import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class FormInputResponseDto {
  @ApiProperty({ example: '1', description: 'Form input id' })
  id: number;

  @ApiProperty({ example: '1', description: 'Form id to which this input belongs' })
  formId: number;

  @ApiProperty({ example: 'Email', description: 'Field name of the form input' })
  fieldName: string;

  @ApiProperty({ example: 'text', description: 'Type of the form input (e.g., text, number, select)' })
  type: string;

  @ApiProperty({ example: true, description: 'Indicates if this field is required' })
  required: boolean;

  @ApiProperty({ example: '^[a-zA-Z0-9]+$', description: 'Regex pattern for input validation', required: false })
  regex?: string;

  @ApiProperty({ example: ['Option1', 'Option2'], description: 'List of options for the form input (if applicable)', required: false })
  options?: any;
}

export class GetFormOfShowingDataDto {
  @ApiProperty({ example: '1', description: 'Form id' })
  id: number;

  @ApiProperty({ example: 'Registration Form', description: 'Name of the form' })
  name: string;

  @ApiProperty({ type: [FormInputResponseDto], description: 'List of form inputs' })
  FormInput: FormInputResponseDto[];
}

export class GetFormOfShowingResponseDto extends BaseResponse {
  @ApiProperty({ type: GetFormOfShowingDataDto, description: 'Data of the form' })
  data: GetFormOfShowingDataDto;
}