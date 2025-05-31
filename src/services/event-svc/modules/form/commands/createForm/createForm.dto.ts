import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { JsonValue } from "@prisma/client/runtime/library";

export class CreateFormInputDto {
  @ApiProperty({ example: 'Name', description: 'Field name of the form input' })
  @IsString()
  fieldName: string;

  @ApiProperty({ example: 'text', description: 'Type of the form input (e.g., text, number, select)' })
  @IsString()
  type: string;

  @ApiProperty({ example: true, description: 'Indicates if this field is required' })
  @IsBoolean()
  required: boolean;

  @ApiProperty({ example: '^[a-zA-Z0-9]+$', description: 'Regex pattern for input validation', required: false })
  @IsOptional()
  @IsString()
  regex?: string;

  @ApiProperty({ example: ['Option1', 'Option2'], description: 'List of options for the form input (if applicable)', required: false })
  @IsOptional()
  @IsArray()
  options?: JsonValue[];
}

export class CreateFormDto {
  @ApiProperty({ example: 'Registration Form', description: 'Name of the form' })
  @IsString()
  name: string;

  @ApiProperty({ type: [CreateFormInputDto], description: 'List of form inputs' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFormInputDto)
  formInputs: CreateFormInputDto[];
}