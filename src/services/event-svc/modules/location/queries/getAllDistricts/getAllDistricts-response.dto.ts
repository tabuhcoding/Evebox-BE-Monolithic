import { ApiProperty } from '@nestjs/swagger';

export class I18nName {
  @ApiProperty({
    description: 'Vi name',
    example: 'vi',
  })
  vi: string;

  @ApiProperty({
    description: 'En name',
    example: 'TP HCM',
  })
  en: string;
}

class DistrictDTO {
  @ApiProperty({
    description: 'District ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'District Name',
    type: I18nName,
  })
  name: I18nName;
}

export class ProvinceDTO{
  @ApiProperty({
    description: 'Province ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Province Name',
    type: I18nName,
  })
  name: I18nName;

  @ApiProperty({
    description: 'List of districts',
    type: [DistrictDTO],
  })
  districts: DistrictDTO[];
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
    type: [ProvinceDTO],
  })
  data: ProvinceDTO[];
}