import {
    Controller, Post, Body, Req, UseGuards, Res, HttpStatus
  } from '@nestjs/common';
  import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
  import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
  import {
    TurnOnNotificationDto,
    TurnOnNotificationResponse
  } from './turn-on-notification.dto';
  import { TurnOnNotificationService } from './turn-on-notification.service';
  import { Response } from 'express';
  
  @ApiTags('User')
  @Controller('api/user')
  export class TurnOnNotificationController {
    constructor(private readonly turnOnNotificationService: TurnOnNotificationService) {}
  
    @UseGuards(JwtAuthGuard)
    @Post('notification')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Turn on notification for an event or organizer' })
    @ApiResponse({ status: 200, type: TurnOnNotificationResponse })
    async turnOnNotification(
      @Body() dto: TurnOnNotificationDto,
      @Req() req: any,
      @Res() res: Response,
    ) {
      const email = req.user.email;
      const result = await this.turnOnNotificationService.execute(dto, email);
  
      if (result.isOk()) {
        return res.status(HttpStatus.OK).json({
          statusCode: 200,
          message: 'Notification turned on successfully',
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
  