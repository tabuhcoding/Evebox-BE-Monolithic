// getAllLocation-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

class EventDto {
  @ApiProperty({ example: 'Concert Night' })
  title: string;

  @ApiProperty({ example: 'Stadium A' })
  venue: string;

  @ApiProperty({ example: 'XYZ Entertainment' })
  orgName: string;
}

class VenueDto {
  @ApiProperty({ example: '123 Lê Lợi' })
  street: string;

  @ApiProperty({ example: 'Phường 7' })
  ward: string;

  @ApiProperty({ example: 'Quận Gò Vấp' })
  district: string;

  @ApiProperty({ example: 'Thành phố Hồ Chí Minh' })
  province: string;

  @ApiProperty({ type: EventDto })
  event: EventDto;
}

export class OrganizerLocationDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'abc123' })
  organizerId: string;

  @ApiProperty({ type: [VenueDto] })
  venues: VenueDto[];
}

export class GetAllLocationsResponseDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Locations fetched successfully' })
  message: string;

  @ApiProperty({ type: [OrganizerLocationDto] })
  data: OrganizerLocationDto[];
}
