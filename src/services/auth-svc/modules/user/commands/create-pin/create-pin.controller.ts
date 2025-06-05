import { Controller, Post, Body, Res, HttpStatus, Request, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { ApiBadRequestResponse, ApiBearerAuth, ApiOperation, ApiUnauthorizedResponse, ApiResponse, ApiTags } from "@nestjs/swagger";

import { CreatePinUserDto } from "./create-pin.dto";
import { CreatePinUserCommand } from "./create-pin.command";
import { ErrorHandler } from "src/shared/exceptions/error.handler";
import { USER_MESSAGES } from "src/shared/constants/constants";
import { CreateUserPinService } from "./create-pin.service";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Auth Service - User')
@Controller('api/user')
export class CreateUserPinController {
  constructor(
    private readonly createPinUserService: CreateUserPinService,
    private readonly slackService: SlackService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post('pin')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create Pin',
    description: 'Creates a new pin for the user'
  })
  @ApiBadRequestResponse({
    description: 'Invalid input format'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials'
  })
  @ApiResponse({
    status: 200,
    description: 'Pin created successfully',
    type: CreatePinUserDto,
  })

  async createPin(@Request() req, @Body() createPinUserDto: CreatePinUserDto, @Res() res: Response) {
    try {
      const email = req.user?.email;
      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }
      
      const command = new CreatePinUserCommand(
        createPinUserDto.pin,
        req.user.email,
      );

      const result = await this.createPinUserService.execute(command);

      if (result.isErr()) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(ErrorHandler.badRequest(result.unwrapErr().message));
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: USER_MESSAGES.SUCCESS.PIN_CREATED,
      });
    } catch (error) {
      this.slackService.sendError(`Auth Service - User >>> CreateUserPinStatusController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}
