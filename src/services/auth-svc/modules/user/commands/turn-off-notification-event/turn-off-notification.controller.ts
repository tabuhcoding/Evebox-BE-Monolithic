import {
    Controller, Delete, Body, Req, UseGuards, Res, HttpStatus,
    Param,
  } from '@nestjs/common';
  import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
  import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
  import { TurnOffNotificationServiceForEvent } from './turn-off-notification.service';
  import { Response } from 'express';
  
  @ApiTags('Auth Service - User')
  @Controller('api/user')
  export class TurnOffNotificationForEventController {
    constructor(private readonly turnOffNotificationService: TurnOffNotificationServiceForEvent) {}

  @UseGuards(JwtAuthGuard)
  @Delete('notification/event/:eventId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Turn off notification for an event' })
  @ApiParam({ name: 'eventId', type: String, example: '123' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        statusCode: 200,
        message: 'Notification turned off successfully',
        data: { success: true },
      },
    },
  })
  async turnOffNotification(
    @Param('eventId') eventId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const email = req.user.email;
    const result = await this.turnOffNotificationService.execute(eventId, email);

    if (result.isOk()) {
      return res.status(HttpStatus.OK).json({
        statusCode: 200,
        message: 'Notification turned off successfully',
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
  