import { Controller, Post, Body, HttpStatus, Res, Headers, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { ApiTags, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse, ApiBody, ApiBearerAuth } from "@nestjs/swagger";
import { Response } from "express";
import { ChangePasswordDto } from "./change-password.dto";
import { ChangePasswordService } from "./change-password.service";
import { ErrorHandler } from "src/shared/exceptions/error.handler";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Authentication Service')
@Controller('api/user')
export class ChangePasswordController {
  constructor(
    private readonly changePasswordService: ChangePasswordService,
    private readonly slackService: SlackService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('/change-password')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change user password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiOkResponse({ description: 'Password has been changed successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Res() res: Response,
    @Request() req
  ) {
    try {
      const email = req.user?.email;
      if (!email) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json(ErrorHandler.unauthorized('User email is required'));
      }

      const result = await this.changePasswordService.execute(dto, email);

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

        if (error.message === 'Invalid old password') {
          return res
            .status(HttpStatus.BAD_REQUEST)
            .json(ErrorHandler.badRequest('Old password is incorrect'));
        }

        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(ErrorHandler.badRequest(error.message));
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Password has been changed successfully',
      });
    } catch (error) {
      this.slackService.sendError(`AuthSvc - User >>> ChangePasswordController: ${error.message}`);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(ErrorHandler.internalServerError('Failed to change password'));
    }
  }
}