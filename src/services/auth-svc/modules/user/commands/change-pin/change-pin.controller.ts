import { Controller, Put, Body, Res, HttpStatus, Request, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { ApiBadRequestResponse, ApiBearerAuth, ApiOperation, ApiTags, ApiUnauthorizedResponse, ApiResponse } from "@nestjs/swagger";

import { ChangeUserPinDto } from "./change-pin.dto";
import { ChangeUserPinCommand } from "./change-pin.command";
import { ErrorHandler } from "src/shared/exceptions/error.handler";
import { USER_MESSAGES } from "src/shared/constants/constants";
import { ChangeUserPinService } from "./change-pin.service";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Auth Service - User')
@Controller('api/user')
export class ChangeUserPinController {
  constructor(
    private readonly changeUserPinService: ChangeUserPinService,
    private readonly slackService: SlackService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Put('pin')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Change Pin',
    description: 'Changes the existing pin for the user'
  })
  @ApiBadRequestResponse({
    description: 'Invalid input format'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials'
  })
  @ApiResponse({
    status: 200,
    description: 'Pin changed successfully',
    type: ChangeUserPinDto,
  })

  async createPin(@Request() req, @Body() changeUserPinDto: ChangeUserPinDto, @Res() res: Response) {
    try {
      const email = req.user?.email;
      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      const command = new ChangeUserPinCommand(
        changeUserPinDto.pin,
        req.user.email,
      );

      const result = await this.changeUserPinService.execute(command);

      if (result.isErr()) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(ErrorHandler.badRequest(result.unwrapErr().message));
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: USER_MESSAGES.SUCCESS.PIN_CHANGED,
      });
    } catch (error) {
      await this.slackService.sendError(`Auth Service - User >>> ChangeUserPinController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}