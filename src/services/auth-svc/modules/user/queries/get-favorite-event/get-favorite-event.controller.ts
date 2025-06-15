import { Controller, Get, Req, Res, UseGuards, HttpStatus, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { GetFavoriteEventService } from './get-favorite-event.service';
import { GetFavoriteEventResponse } from './get-favorite-event.dto';
import { Response } from 'express';
import { PaginationQuery } from 'src/shared/constants/pagination';

@ApiTags('Auth Service - User')
@Controller('api/user')
export class GetFavoriteEventController {
  constructor(
    private readonly getFavoriteEventService: GetFavoriteEventService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('favorite/event')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all favorited events' })
  @ApiResponse({ status: 200, type: GetFavoriteEventResponse })
  async getFavoriteEvent(
    @Req() req: any, 
    @Res() res: Response,
    @Query() pagination: PaginationQuery
  ) {
    const email = req.user.email;
    const result = await this.getFavoriteEventService.execute(email, {
      page: pagination.page >> 0 || 1,
      limit: pagination.limit >> 0 || 10,
    });

    if (result.isOk()) {
      return res.status(HttpStatus.OK).json({
        statusCode: 200,
        message: 'Get favorite events successfully',
        data: result.unwrap(),
      });
    }

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      message: result.unwrapErr().message,
      data: [],
    });
  }
}
