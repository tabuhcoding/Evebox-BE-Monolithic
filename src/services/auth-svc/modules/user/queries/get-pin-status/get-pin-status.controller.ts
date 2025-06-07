import { Controller, Get, HttpStatus, Res, UseGuards, Request } from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiUnauthorizedResponse, ApiOkResponse, ApiForbiddenResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { UserPinStatusResponse } from "./get-pin-status.response.dto";
import { GetUserPinStatusService } from "./get-pin-status.service";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Auth Service - User')
@Controller('api/user')
export class GetUserPinStatusController {
  constructor(
    private readonly userPinService: GetUserPinStatusService,
    private readonly slackService: SlackService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get('pin')
  @ApiOperation({
    summary: 'Get User Pin Status',
    description: 'Retrieves the pin status of the currently authenticated user',
  })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    description: 'User pin status fetched successfully',
    type: UserPinStatusResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiForbiddenResponse({
    description: 'PIN verification required',
    content: {
      'application/json': {
        examples: {
          pinSetupRequired: {
            value: {
              requiresPinSetup: true,
            },
          },
          pinVerificationRequired: {
            value: {
              requiresPinVerification: true,
              remainingAttempts: 2,
              message: 'PIN verification required',
            },
          },
        },
      },
    },
  })
  async getUserPinStatus(@Request() req, @Res() res: Response) {
    try {
      const pinStatus = await this.userPinService.execute(req.user.email);

      return res.status(HttpStatus.OK).json({
        statusCode: 200,
        message: 'User pin status fetched successfully',
        data: {
          ...pinStatus.unwrap(),
        },
      });
    } catch (error) {
      this.slackService.sendError(`Auth Service - User >>> GetUserPinStatusController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}