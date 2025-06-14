import { ApiProperty } from '@nestjs/swagger';

class LocationDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '123 Le Lai' })
  street: string;

  @ApiProperty({ example: 'Ward 1' })
  ward: string;

  @ApiProperty({ example: 'District 1' })
  district: string;

  @ApiProperty({ example: 'Ho Chi Minh' })
  province: string;

  @ApiProperty({ example: 'Rex Hotel' })
  venue: string;
}

export class GetOrgLocationsResponseDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Locations retrieved successfully' })
  message: string;

  @ApiProperty({ type: [LocationDto] })
  data: LocationDto[];
}
