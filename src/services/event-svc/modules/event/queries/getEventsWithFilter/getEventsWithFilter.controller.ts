import { Controller, Get, Query, Res, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetEventFrontDisplayResponse } from '../getEventFrontDisplay/getEventFrontDisplay-response.dto';
import { SearchEventService } from './getEventsWithFilter.service';
import { JwtOptionalGuard } from 'src/shared/guard/jwt-optional.guard';
import { GetEventsWithFilterResponseDto } from './getEventsWithFilter-response.dto';

@ApiTags('Event Service - Event')
@Controller('api/event/search')
export class SearchEventController {
  constructor(private readonly searchService: SearchEventService) {}

  @Get('/')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtOptionalGuard)
  @ApiQuery({ name: 'title', required: false, type: String, description: 'Title of the event to search for' })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Type of the event (comma-separated)' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date of the event' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date of the event' })
  @ApiQuery({ name: 'minPrice', required: false, type: String, description: 'Minimum price of the event' })
  @ApiQuery({ name: 'maxPrice', required: false, type: String, description: 'Maximum price of the event' })
  @ApiQuery({ name: 'provinceId', required: false, type: Number, description: 'Province ID of the event' })
  @ApiQuery({ name: 'page', required: false, type: String, description: 'Number of pages to return' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Number of events to return' })
  @ApiOperation({ summary: 'Search events by title' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Events found successfully',
    type: GetEventsWithFilterResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input',
  })
  async search(
    @Res() res: Response,
    @Request() req,
    @Query('title') title: string, 
    @Query('type') type?: string, 
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string, 
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string, 
    @Query('provinceId') provinceId?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const typeArray = type ? type.split(',').map((item) => item.trim()) : [];
    const minPriceNum = minPrice ? parseInt(minPrice, 10) : undefined;
    const maxPriceNum = maxPrice ? parseInt(maxPrice, 10) : undefined;
    const result = await this.searchService.execute(
      title,
      typeArray,
      startDate,
      endDate, 
      minPriceNum, 
      maxPriceNum,
      provinceId >> 0,
      page >> 0 || 1,
      limit >> 0 || 10,
      req.user?.email || null,
    );

    if (result.isErr()) {
      const error = result.unwrapErr();
      const statusCode = HttpStatus.BAD_REQUEST;

      return res.status(statusCode).json({
        statusCode,
        message: error.message,
      });
    }

    const data = result.unwrap();

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Events found successfully',
      data: data[0],
      pagination: data[1]
    });
  }
}
