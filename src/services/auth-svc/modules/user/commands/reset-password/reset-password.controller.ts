import { Controller, Post, Body, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { ResetPasswordCommand } from './reset-password.command';
import { ResetPasswordService } from './reset-password.service';
import { ErrorHandler } from 'src/shared/exceptions/error.handler';
import { ResetPasswordDto, ResetPasswordResponse } from './reset-password.dto';

@Controller('api/user')
@ApiTags('Authentication')
export class ResetPasswordController {
  constructor(
    private readonly resetPasswordService: ResetPasswordService,
  ) {}

  @Post('reset-password')
  @ApiOperation({ 
    summary: 'Reset password using reset token',
    description: 'Reset user password using token received after OTP verification'
  })
  @ApiBody({ type: ResetPasswordDto})
  @ApiOkResponse({
    description: 'Password reset successfully',
    type: ResetPasswordResponse
  })
  @ApiBadRequestResponse({
    description: 'Invalid input or reset token'
  })
  @ApiNotFoundResponse({
    description: 'User not found'
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to reset password'
  })
  async resetPassword(@Body() command: ResetPasswordCommand, @Res() res: Response) {
    try {
      const result = await this.resetPasswordService.execute(command);
      
      if (result.isErr()) {
        const error = result.unwrapErr();
        
        if (error.message === 'User not found') {
          return res
            .status(HttpStatus.NOT_FOUND)
            .json(ErrorHandler.notFound('User not found'));
        }
        
        if (error.message === 'Passwords do not match') {
          return res
            .status(HttpStatus.BAD_REQUEST)
            .json(ErrorHandler.badRequest('Passwords do not match'));
        }
        
        if (error.message === 'Invalid reset token') {
          return res
            .status(HttpStatus.BAD_REQUEST)
            .json(ErrorHandler.badRequest('Invalid reset token'));
        }
        
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(ErrorHandler.badRequest(error.message));
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Password has been reset successfully',
        data: result.unwrap()
      });
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(ErrorHandler.internalServerError('Failed to reset password'));
    }
  } 
}