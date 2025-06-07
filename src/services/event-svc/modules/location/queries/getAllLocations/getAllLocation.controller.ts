import { Controller, Get, HttpStatus, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { GetAllLocationsService } from './getAllLocation.service';
import { GetAllLocationsResponseDto } from './getAllLocation-response.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';

@ApiTags('Event Service - Location')
@Controller('api')
export class GetAllLocationsController {
  constructor(private readonly getAllLocationsService: GetAllLocationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/location/all')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all locations with district and province names' })
  @ApiQuery({ name: 'organizerId', required: false, type: String })
  @ApiQuery({ name: 'provinceId', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Locations retrieved successfully',
    type: GetAllLocationsResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async findAll(@Query('organizerId') organizerId: string, @Query('provinceId') provinceId: string,@Req() req: any, @Res() res: Response) {
    const user = req.user.email;  
    let province;
    if (provinceId){
        province=parseInt(provinceId);
    }
    try {
      const result = await this.getAllLocationsService.getAllLocations(user,organizerId, province);
      console.log(result);
      return res.status(HttpStatus.OK).json(result.unwrap());
    } catch (error) {
          console.error('[GetAllLocationsController] ERROR:', error); // ← LOG HERE

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}
