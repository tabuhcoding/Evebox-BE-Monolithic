import { Controller, Post, Query, Body, Request, UseGuards, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DailyEmbeddingService } from './dailyEmbedding.service';

@ApiTags('Cron')
@Controller('org/cron')
export class CronController {
  constructor(private readonly service: DailyEmbeddingService) {}

  @Post('/')
  @ApiOperation({ summary: 'Add member to event' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Added member successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async addMember(
    @Request() req: any,
    @Res() res: Response, 
  ) {
    this.service.fakeOrderData();
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Fake order data processing started successfully',
    });
  }
  }

