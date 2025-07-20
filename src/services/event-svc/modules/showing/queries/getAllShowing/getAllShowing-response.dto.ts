import { ApiProperty } from '@nestjs/swagger';

export class AllShowingsResponseDto {
  @ApiProperty({ example: 200, description: 'Response status code' })
  statusCode: number;

  @ApiProperty({
    example: 'Showing data retrieved successfully',
    description: 'Response message',
  })
  message: string;

  @ApiProperty({
    example: '16962844867169,16962844867170',
    description: 'Comma-separated string of Showing IDs',
  })
  data: {
    showingIds: string[];
  };
}

export class ConnectShowingToSeatmapDTO {
  @ApiProperty({ example: '16962844867169', description: 'Showing ID' })
  showingId: string;

  @ApiProperty({ example: 123, description: 'Seatmap ID' })
  seatmapId: number;

  @ApiProperty({
    example: { '16962844867171': [23456] },
    description: 'Ticket Type Section Map',
  })
  ticketTypeSectionMap: Record<string, number[]>;
}