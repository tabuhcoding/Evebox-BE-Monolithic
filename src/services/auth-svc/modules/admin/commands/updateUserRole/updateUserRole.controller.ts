import { Controller, HttpStatus, Res, Put, Param, Body, UseGuards, Request } from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiOperation, ApiOkResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse, ApiBody, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { ErrorHandler } from "src/shared/exceptions/error.handler";
import { UpdateUserRoleDto } from "./updateUserRole.dto";
import { UpdateUserRoleService } from "./updateUserRole.service";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Controller('api/admin')
@ApiTags('Authentication Service - Admin')
export class UpdateUserRoleController {
  constructor(
    private readonly updateUserRoleService: UpdateUserRoleService,
    private readonly slackService: SlackService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Put('/:userId/role')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update user role',
    description: 'Update role of user by userId',
  })
  @ApiBody({
    description: 'Update role user',
    type: UpdateUserRoleDto,
  })
  @ApiOkResponse({
    description: 'Update role user successfully',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to update role user information',
  })
  async updateUserRole(
    @Res() res: Response,
    @Body() dto: UpdateUserRoleDto,
    @Param('userId') userId: string,
    @Request() req,
  ) {
    try {
      if (!userId) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(ErrorHandler.badRequest('User ID is required'));
      }

      if (dto.role === undefined || dto.role === null) {
        return res
        .status(HttpStatus.BAD_REQUEST)
        .json(ErrorHandler.badRequest('Role is required'));
      }
      
      const email = req.user?.email;

      const result = await this.updateUserRoleService.execute(dto, userId, email);

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
        message: 'Update role user successfully',
      });
    } catch (error) {
      this.slackService.sendError(`AuthSvc - User >>> UpdateUserRoleController: ${error.message}`);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          ErrorHandler.internalServerError(
            'Failed to update role user information',
          ),
        );
    }
  }
}