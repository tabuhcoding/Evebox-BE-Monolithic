import { ApiProperty } from '@nestjs/swagger';

export class FavoriteOrgResponseData {
  @ApiProperty({ example: 'org_abc123' })
  orgId: string;
}

export class GetFavoriteOrgResponse {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Get favorite organizers successfully' })
  message: string;

  @ApiProperty({ type: [FavoriteOrgResponseData] })
  data: FavoriteOrgResponseData[];
}
