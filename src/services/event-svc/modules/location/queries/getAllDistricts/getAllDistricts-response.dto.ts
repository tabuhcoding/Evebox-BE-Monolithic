import { ApiProperty } from '@nestjs/swagger';

class District {
  @ApiProperty({
    description: 'District ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'District Name',
    example: 'Quan 1',
  })
  name: string;
}

export class Province{
  @ApiProperty({
    description: 'Province ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Province Name',
    example: 'TP HCM',
  })
  name: string;

  @ApiProperty({
    description: 'List of districts',
    type: [District],
  })
  districts: District[];
}

export class GetAllDistrictsResponseDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({
    example: 'Districts fetched successfully',
    description: 'Districts fetched successfully',
  })
  message: string;

  @ApiProperty({
    type: [Province],
  })
  data: Province[];
}