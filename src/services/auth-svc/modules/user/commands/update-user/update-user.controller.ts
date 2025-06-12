import { Controller, Body, HttpStatus, Res, UseGuards, Request, Put, Headers } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth, ApiBadRequestResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse, ApiBody } from "@nestjs/swagger";
import { Response } from "express";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { ErrorHandler } from "src/shared/exceptions/error.handler";
import { UpdateUserDto } from "./update-user.dto";
import { UpdateUserService } from "./update-user.service";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";


@Controller('api/user')
@ApiTags('Authentication Service - User')
export class UpdateUserController {
  constructor(
    private readonly updateUserService: UpdateUserService,
    private readonly slackService: SlackService
  ) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("access_token")
  @Put('me')
  @ApiOperation({
    summary: 'Update information user',
    description: 'Update user information such as name and phone number',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({
    description: 'Update user successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to update user information',
  })
  async updateUser(
    @Body() dto: UpdateUserDto,
    @Res() res: Response,
    @Request() req: any
  ) {
    try {
      const email = req.user?.email;
      if (!email) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(ErrorHandler.notFound('User not found'));
      }

      const result = await this.updateUserService.execute(dto, email);

      if (result.isErr()) {
        const error = result.unwrapErr();

        if (error.message === 'User not found') {
          return res
            .status(HttpStatus.NOT_FOUND)
            .json(ErrorHandler.notFound('User not found'));
        }

        if (error.message === 'Invalid input data') {
          return res
            .status(HttpStatus.BAD_REQUEST)
            .json(ErrorHandler.badRequest('Invalid input data'));
        }

        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(ErrorHandler.badRequest(error.message));
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Update user successfully',
      });
    } catch (error) {
      await this.slackService.sendError(`AuthSvc - User >>> UpdateUserController: ${error.message}`);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          ErrorHandler.internalServerError('Failed to update user information'),
        );
    }
  }
}