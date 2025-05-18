import { Controller, Post, Body, HttpStatus, HttpException, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiOkResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { ResendOTPDto, ResendOTPResponse } from './resend-otp.dto';
import { ResendOTPService } from './resend-otp.service';
import { ResendOTPCommand } from './resend-otp.command';
import { Response } from 'express';
import { ErrorHandler } from 'src/shared/exceptions/error.handler';
import { USER_MESSAGES } from 'src/shared/constants/constants';

@Controller('api/user/otps')
@ApiTags('Authentication')
export class ResendOTPController {
  constructor(private readonly resendOTPService: ResendOTPService) {}

  @Post('resend-otp')
  @ApiOperation({ 
    summary: 'Resend OTP code',
    description: 'Resend OTP verification code to user email'
  })
  @ApiOkResponse({
    description: 'OTP resent successfully',
    type: ResendOTPResponse
  })
  @ApiBadRequestResponse({
    description: 'Invalid email or cooldown period not elapsed'
  })
  async resendOTP(@Body() dto: ResendOTPDto, @Res() res: Response) {
    const command = new ResendOTPCommand(
      dto.email, 
      dto.type,
      dto.request_token
    );
    
    const result = await this.resendOTPService.execute(command);

    if (result.isErr()) {
      return res
          .status(HttpStatus.BAD_REQUEST)
          .json(ErrorHandler.badRequest(result.unwrapErr().message));
    }

    const data = result.unwrap();
    return {
      statusCode: HttpStatus.OK,
      message: USER_MESSAGES.SUCCESS.OTP_RESENT,
      data: {
        remaining_attempts: data.remaining_attempts,
        resend_allowed_in: data.resend_allowed_in
      },
    };
  }
}