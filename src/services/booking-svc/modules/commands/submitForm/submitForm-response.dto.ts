import { ApiProperty } from '@nestjs/swagger';

export class FormAnswerResponseDto {
  @ApiProperty({ example: 1, description: 'Form Answer ID' })
  id: number;

  @ApiProperty({ example: 1, description: 'Form Input ID' })
  formInputId: number;

  @ApiProperty({ example: 'John Doe', description: 'Value entered by the user' })
  value: string;
}

export class SubmitFormResponseData{
  @ApiProperty({ example: 12345, description: 'Form Response ID' })
  formResponseId: number;

  @ApiProperty({ type: [FormAnswerResponseDto], description: 'List of submitted answers' })
  answers: FormAnswerResponseDto[];
}

export class SubmitFormResponseDto {
  @ApiProperty({ example: 200, description: 'Response status code' })
  statusCode: number;

  @ApiProperty({ example: 'Form submitted successfully', description: 'Response message' })
  message: string;

  @ApiProperty({ type: SubmitFormResponseData, description: 'Data returned after submitting the form' })
  data: SubmitFormResponseData;
}