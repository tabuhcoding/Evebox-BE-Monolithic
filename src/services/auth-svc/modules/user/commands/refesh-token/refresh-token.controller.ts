import { Controller, Post, Body, HttpStatus, HttpException, Res } from '@nestjs/common';
import { Response } from 'express';
import { RefreshTokenService } from './refresh-token.service';
import { RefreshTokenCommand } from './refresh-token.command';
import { ApiBadRequestResponse, ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ErrorHandler } from 'src/shared/exceptions/error.handler';
import { RefreshTokenDto, RefreshTokenResponse } from './refresh-token.dto';
import { REFRESH_TOKEN_MESSAGES } from 'src/shared/constants/constants';

@Controller('api/user')
@ApiTags('Authentication')
export class RefreshTokenController {
  constructor(private readonly refreshTokenService: RefreshTokenService) {}

  @Post('refresh-token')
  @ApiOperation({ 
    summary: 'Refresh access token',
    description: 'Generate new access token using refresh token'
  })
  @ApiOkResponse({
    description: 'Token refreshed successfully',
    type: RefreshTokenResponse
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token'
  })
  @ApiBadRequestResponse({
    description: 'Missing refresh token'
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to refresh token'
  })
  async refreshToken(@Body() dto: RefreshTokenDto, @Res() res: Response) {
    try {
      if (!dto.refresh_token) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(ErrorHandler.badRequest(REFRESH_TOKEN_MESSAGES.ERRORS.MISSING_REFRESH_TOKEN));
      }

      const command = new RefreshTokenCommand(dto.refresh_token);
      const result = await this.refreshTokenService.execute(command);
      
      if (result.isErr()) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json(ErrorHandler.unauthorized(result.unwrapErr().message));
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: REFRESH_TOKEN_MESSAGES.SUCCESS.REFRESHED,
        data: result.unwrap()
      });
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(ErrorHandler.internalServerError(REFRESH_TOKEN_MESSAGES.ERRORS.FAILED_REFRESH_TOKEN));
    }
  }
}
