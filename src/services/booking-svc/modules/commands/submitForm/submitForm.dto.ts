import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class FormAnswerDto {
  @ApiProperty({ example: 1, description: 'Form Input ID' })
  @IsInt()
  formInputId: number;

  @ApiProperty({ example: 'John Doe', description: 'Value entered by the user' })
  @IsString()
  value: string;
}

export class SubmitFormDto {
  @ApiProperty({ example: 1, description: 'Form ID' })
  @IsInt()
  formId: number;

  @ApiProperty({ example: "16962844867169", description: 'Showing ID' })
  @IsString()
  showingId: string;

  @ApiProperty({ type: [FormAnswerDto], description: 'List of answers' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormAnswerDto)
  answers: FormAnswerDto[];
}