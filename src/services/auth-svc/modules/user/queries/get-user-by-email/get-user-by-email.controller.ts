import { Controller, Get, HttpStatus, Res, Param } from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiOperation, ApiNotFoundResponse, ApiOkResponse } from "@nestjs/swagger";
import { ErrorHandler } from "src/shared/exceptions/error.handler";
import { UserResponseById } from "../get-user-by-id/get-user-by-id-response.dto";
import { GetUserByEmailService } from "./get-user-by-email.service";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Auth Service - User')
@Controller('api/user')
export class GetUserByEmailController {
  constructor(
    private readonly getUserByEmailService: GetUserByEmailService,
    private readonly slackService: SlackService
  ) { }

  @Get('/email/:email')
  @ApiOperation({
    summary: 'Get user by email',
    description: 'Fetch user details by email'
  })
  @ApiOkResponse({
    description: 'User details fetched successfully',
    type: UserResponseById
  })
  @ApiNotFoundResponse({
    description: 'User not found'
  })

  async getUserByEmail(
    @Param('email') email: string,
    @Res() res: Response,
  ) {
    try {
      const userData = await this.getUserByEmailService.execute(email);

      if (userData.isErr()) {
        return res.status(404).json(ErrorHandler.notFound('User not found'));
      }

      return res.status(HttpStatus.OK).json({
        statusCode: 200,
        message: 'User details fetched successfully',
        data: {
          ...userData.unwrap(),
        }
      });
    } catch (error) {
      await this.slackService.sendError(`Auth Svc >>> GetUserByEmailController: ${error.message}`);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}