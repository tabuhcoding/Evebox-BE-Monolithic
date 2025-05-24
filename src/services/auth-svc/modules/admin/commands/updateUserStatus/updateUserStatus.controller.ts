import { Controller, HttpStatus, Res, Put, Param, Body } from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiOperation, ApiOkResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse, ApiBody } from "@nestjs/swagger";
import { ErrorHandler } from "src/shared/exceptions/error.handler";
import { UpdateUserStatusDto } from "./updateUserStatus.dto";
import { UpdateUserStatusService } from "./updateUserStatus.service";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Controller('api/admin')
@ApiTags('Authentication Service - Admin')
export class UpdateUserStatusController {
  constructor(
    private readonly updateUserStatusService: UpdateUserStatusService,
    private readonly slackService: SlackService
  ) { }

  @Put('/:userId/status')
  @ApiOperation({
    summary: 'Update status user',
    description: 'Update status user by userId',
  })
  @ApiBody({
    description: 'Update status user',
    type: UpdateUserStatusDto
  })
  @ApiOkResponse({
    description: 'Update status user successfully',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to Update status user information',
  })
  async updateUserStatus(
    @Res() res: Response,
    @Body() dto: UpdateUserStatusDto,
    @Param('userId') userId: string,
  ) {
    try {
      if (!userId) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(ErrorHandler.badRequest('User ID is required'));
      }

      if (!dto.status) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(ErrorHandler.badRequest('Status is required'));
      }

      const result = await this.updateUserStatusService.execute(dto, userId);

      if (result.isErr()) {
        const error = result.unwrapErr();

        if (error.message === 'User not found') {
          return res
            .status(HttpStatus.NOT_FOUND)
            .json(ErrorHandler.notFound('User not found'));
        }

        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(ErrorHandler.badRequest(error.message));
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Update status user successfully',
      });
    } catch (error) {
      this.slackService.sendError(`AuthSvc - User >>> UpdateUserStatusController: ${error.message}`);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          ErrorHandler.internalServerError(
            'Failed to Update status user information',
          ),
        );
    }
  }
}