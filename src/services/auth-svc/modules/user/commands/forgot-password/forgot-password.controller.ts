import { Controller, Post, Body, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiResponse, ApiOperation, ApiProperty, ApiOkResponse, ApiBadRequestResponse, ApiNotFoundResponse} from '@nestjs/swagger';
import { ForgotPasswordUserCommand } from './forgot-password.command';
import { ForgotPasswordUserService } from './forgot-password.service';
import { ForgotPasswordResponse, ForgotPasswordUserDto } from './forgot-password.dto';
import { ErrorHandler } from 'src/shared/exceptions/error.handler';
import { USER_MESSAGES } from 'src/shared/constants/constants';

@Controller('api/user')
@ApiTags('Authentication')
export class ForgotPasswordController {
  constructor(
    private readonly forgotPasswordService: ForgotPasswordUserService,
  ) {}

  @Post('forgot-password')
  @ApiOperation({ 
    summary: 'Request OTP for password reset',
    description: 'Sends an OTP to the user\'s email address for password reset'
  })
  @ApiOkResponse({
    description: 'OTP sent successfully',
    type: ForgotPasswordResponse
  })
  @ApiBadRequestResponse({
    description: 'Bad request - Invalid email format'
  })
  @ApiNotFoundResponse({
    description: 'User not found with provided email'
  })
  
  async forgotPassword(
    @Res() res: Response, 
    @Body() forgotPasswordUserDto: ForgotPasswordUserDto
  ): Promise<Response> {
    const command = new ForgotPasswordUserCommand(forgotPasswordUserDto.email);
    const result = await this.forgotPasswordService.execute(command);

    if (result.isErr()) {
      const error = result.unwrapErr();
      
      if (error.message === USER_MESSAGES.ERRORS.USER_NOT_FOUND) {
        return res
          .status(HttpStatus.OK)
          .json(ErrorHandler.notFound());
      }
      
      return res
        .status(HttpStatus.OK)
        .json(ErrorHandler.badRequest(error.message));
    }

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: USER_MESSAGES.SUCCESS.OTP_SENT,
      data: {
        ...result.unwrap(),
      }
    });
  }
}
