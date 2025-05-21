import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetEventFDByIdsService } from "./getEventFDByIds.service";
import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { GetEventFDByIdsResponse } from "./getEventFDByIds-response.dto";


@ApiTags('Event Service - Event')
@Controller('api/event')
export class GetEventFDByIdsController {
  constructor(
    private readonly getEventFDByIdsService: GetEventFDByIdsService,
  ) {}

  @Get('/fd-by-ids')
  @ApiOperation({ summary: 'Get event FD by IDs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event FD by IDs retrieved successfully',
    type: GetEventFDByIdsResponse,
  })
  async getEventFDByIds(@Query('ids') ids: number[]
  , @Res() res: Response) {
    const idsArray = Array.isArray(ids) ? ids : [ids];
    const parseIds = idsArray.map(id => id >> 0);
    const result = await this.getEventFDByIdsService.execute(parseIds);
    if (result.isErr()) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: result.unwrapErr().message,
      });
    }
    const data = result.unwrap();
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Event FD by IDs retrieved successfully',
      data,
    });
  }
}