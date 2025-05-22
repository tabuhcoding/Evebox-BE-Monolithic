import { Controller, Delete, Param, Req, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { UnfavoriteEventService } from './unfavorite-event.service';
import { Response } from 'express';

@ApiTags('User')
@Controller('api/user/favorite/event')
export class UnfavoriteEventController {
  constructor(private readonly removeFavoriteService: UnfavoriteEventService) {}

  @UseGuards(JwtAuthGuard)
  @Delete(':eventId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove favorite event' })
  @ApiResponse({ status: 200, description: 'Favorite removed successfully' })
  async handle(
    @Param('eventId') eventId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const email = req.user.email;
    const result = await this.removeFavoriteService.execute(email, parseInt(eventId));

    if (result.isOk()) {
      return res.status(HttpStatus.OK).json({
        statusCode: 200,
        message: 'Favorite removed successfully',
        data: { success: true },
      });
    }

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      message: result.unwrapErr().message,
      data: { success: false },
    });
  }
}
