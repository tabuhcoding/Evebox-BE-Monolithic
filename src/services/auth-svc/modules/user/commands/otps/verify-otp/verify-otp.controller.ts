import { Controller, Post, Body, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { VerifyOTPCommand } from './verify-otp.command';
import { VerifyOTPService } from './verify-otp.service';
import { VerifyOTPDto, VerifyOTPResponse } from './verify-otp.dto';
import { OTPType } from '../../../domain/enums/otp-type.enum';
import { ErrorHandler } from 'src/shared/exceptions/error.handler';
import { OTP_MESSAGES } from 'src/shared/constants/constants';

@Controller('api/user/otps')
@ApiTags('Authentication Service')
export class VerifyOTPController {
  constructor(
    private readonly verifyOTPService: VerifyOTPService,
  ) {}

  @Post('verify-otp')
  @ApiOperation({ 
    summary: 'Verify OTP code',
    description: 'Verify OTP code sent to user email for registration or password reset'
  })
  @ApiOkResponse({
    description: 'OTP verified successfully',
    type: VerifyOTPResponse
  })
  @ApiBadRequestResponse({
    description: 'Invalid OTP or email'
  })
  @ApiNotFoundResponse({
    description: 'User not found'
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to verify OTP'
  })

  async verifyOTP(@Body() dto: VerifyOTPDto, @Res() res: Response) {
    try {
      const command = new VerifyOTPCommand(dto.email, dto.otp, dto.type, dto.request_token);  
      const result = await this.verifyOTPService.execute(command);

      if (result.isErr()) {
        const error = result.unwrapErr();
        
        return res
            .status(HttpStatus.BAD_REQUEST)
            .json(ErrorHandler.badRequest(error.message));
      }

      const data = result.unwrap();
      const responseMessage = command.type === OTPType.FORGOT_PASSWORD
        ? OTP_MESSAGES.SUCCESS.FORGOT_PASSWORD
        : OTP_MESSAGES.SUCCESS.REGISTER;
      const token = command.type === OTPType.FORGOT_PASSWORD ? data : null;
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: responseMessage,
        data: {
          token: token,
        },
      });
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(ErrorHandler.internalServerError());
    }
  } 
}