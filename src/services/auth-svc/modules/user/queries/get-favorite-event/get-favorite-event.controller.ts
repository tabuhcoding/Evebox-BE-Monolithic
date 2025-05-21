import { Controller, Get, Req, Res, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { GetFavoriteEventService } from './get-favorite-event.service';
import { GetFavoriteEventResponse } from './get-favorite-event.dto';
import { Response } from 'express';

@ApiTags('User')
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
  async getFavoriteEvent(@Req() req: any, @Res() res: Response) {
    const email = req.user.email;
    const result = await this.getFavoriteEventService.execute(email);

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
