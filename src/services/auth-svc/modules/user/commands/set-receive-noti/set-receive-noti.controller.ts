import {
    Controller,
    Post,
    Query,
    Req,
    Res,
    UseGuards,
    HttpStatus,
  } from '@nestjs/common';
  import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
  import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
  import { Response } from 'express';
  import { SetReceiveNotiService } from './set-receive-noti.service';
import { SetReceiveNotiQueryDto, SetReceiveNotiResponse } from './set-receive-noti.dto';
  
  @ApiTags('User')
  @Controller('api/user/notification')
  export class SetReceiveNotiController {
    constructor(private readonly service: SetReceiveNotiService) {}
  
    @UseGuards(JwtAuthGuard)
    @Post('all')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Set receive notification for all types (EVENT & ORG)' })
    @ApiResponse({ status: 200, type: SetReceiveNotiResponse })
    async setReceiveNoti(
        @Query() query: SetReceiveNotiQueryDto,
        @Req() req: any,
        @Res() res: Response,
      ) {
        const email = req.user.email;
        const receive = query.isReceived === 'true';
        const result = await this.service.execute(email, receive);   
  
      if (result.isOk()) {
        return res.status(HttpStatus.OK).json({
          statusCode: 200,
          message: 'Notification preference updated successfully',
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
  