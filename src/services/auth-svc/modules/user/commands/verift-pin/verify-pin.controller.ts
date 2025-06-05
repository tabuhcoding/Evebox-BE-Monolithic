import { Controller, Post, Body, Res, HttpStatus, Request, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { ApiBadRequestResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";


import { VerifyPinResponse, VerifyPinUserDto } from "./verify-pin.dto";
import { VerifyUserPinCommand } from "./verify-pin.command";
import { ErrorHandler } from "src/shared/exceptions/error.handler";
import { USER_MESSAGES } from "src/shared/constants/constants";
import { VerifyUserPinService } from "./verify-pin.service";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Auth Service - User')
@Controller('api/user')
export class VerifyUserPinController {
  constructor(
    private readonly verifyUserPinService: VerifyUserPinService,
    private readonly slackService: SlackService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post('pin/verify')
  @ApiOperation({
    summary: 'Verify PIN',
    description: 'Verifies the user PIN'
  })
  @ApiBearerAuth('access-token')
  @ApiBadRequestResponse({
    description: 'Invalid input format'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials'
  })
  @ApiResponse({
    status: 200,
    description: 'PIN verification result',
    type: VerifyPinResponse,
  })
  async verifyPin(@Request() req, @Body() verifyPinUserDto: VerifyPinUserDto, @Res() res: Response) {
    try {
      const email = req.user?.email;
      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      const command = new VerifyUserPinCommand(
        verifyPinUserDto.pin,
        req.user.email,
      );

      const result = await this.verifyUserPinService.execute(command);

      if (result.isErr()) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(ErrorHandler.badRequest(result.unwrapErr().message));
      }

      const verificationResult = result.unwrap();

      if (verificationResult.isValid) {
        return res.status(HttpStatus.OK).json({
          statusCode: HttpStatus.OK,
          message: USER_MESSAGES.SUCCESS.PIN_VERIFIED,
          data: verificationResult
        });
      } else {
        if (verificationResult.lockedUntil) {
          return res.status(HttpStatus.FORBIDDEN).json({
            statusCode: HttpStatus.FORBIDDEN,
            message: `Account locked until ${verificationResult.lockedUntil}`,
            data: verificationResult
          });
        } else {
          return res.status(HttpStatus.UNAUTHORIZED).json({
            statusCode: HttpStatus.UNAUTHORIZED,
            message: `Invalid PIN. ${verificationResult.remainingAttempts} attempts remaining.`,
            data: verificationResult
          });
        }
      }
    } catch (error) {
      this.slackService.sendError(`Auth Service - User >>> VerifyUserPinController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}