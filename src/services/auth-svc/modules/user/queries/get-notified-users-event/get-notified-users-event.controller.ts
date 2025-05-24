import { Controller, Get, Param, HttpStatus, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { Response } from 'express';
import { GetUsersNotifiedByEventService } from './get-notified-users-event.service';
import { GetNotifiedUsersResponse } from './get-notified-users-event.dto';

@ApiTags('User')
@Controller('api/user')
export class GetUsersNotifiedByEventController {
  constructor(private readonly getUsersNotifiedService: GetUsersNotifiedByEventService) {}

  @UseGuards(JwtAuthGuard)
  @Get('notification/event/:eventId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get users who turned on notifications for an event' })
  @ApiResponse({ status: 200, type: GetNotifiedUsersResponse })
  async getNotifiedUsers(@Param('eventId') eventId: string, @Res() res: Response) {
    const parsedId = parseInt(eventId);
    if (isNaN(parsedId)) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Invalid event ID' });
    }

    const result = await this.getUsersNotifiedService.execute(parsedId);

    if (result.isErr()) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: 500,
        message: result.unwrapErr().message,
      });
    }

    return res.status(HttpStatus.OK).json({ data: result.unwrap() });
  }
}
