import { Controller, Get, HttpStatus, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { GetOrgLocationsService } from './getOrgLocations.service';
import { GetOrgLocationsResponseDto } from './getOrgLocations-response.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';

@ApiTags('Event Service - Location')
@Controller('api/location')
export class GetOrgLocationsController {
  constructor(private readonly getOrgLocationsService: GetOrgLocationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/org')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get locations created by the current organizer (with venue)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Locations retrieved successfully', type: GetOrgLocationsResponseDto, isArray: true })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async findAll(@Req() req: any, @Res() res: Response) {
    try {
      const email = req.user.email;
      const result = await this.getOrgLocationsService.getLocationsByOrganizerEmail(email);
      return res.status(HttpStatus.OK).json(result.unwrap());
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}
