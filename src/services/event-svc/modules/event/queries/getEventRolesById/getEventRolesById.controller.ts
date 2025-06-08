import { Controller, Get, Request, UseGuards, HttpStatus, Res, Param } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from "@nestjs/swagger";
import { Response } from "express";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { GetEventRoleByIdResponseDto } from "./getEventRolesById-response.dto";
import { GetEventRolesByIdService } from "./getEventRolesById.service";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Event')
@Controller('api/event/role')
export class GetEventRolesByIdController {
  constructor(
    private readonly getEventRolesService: GetEventRolesByIdService,
    private readonly slackService: SlackService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', example: 1, description: 'Id of role' })
  @ApiOperation({ summary: 'Get all event roles and their permissions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event Of Organizer retrieved successfully',
    type: GetEventRoleByIdResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden: Only organizers allowed'
  })
  async getRoles(@Request() req: any, @Res() res: Response, @Param('id') idRaw: string) {
    try {
      const id = parseInt(idRaw, 10);
      if (isNaN(id)) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: 400,
          message: 'Invalid role ID',
        });
      }

      const email = req.user?.email;
      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      const result = await this.getEventRolesService.execute(id, req.user.email);

      if (result.isErr()) {
        const errorMessage = result.unwrapErr().message;
        if (errorMessage === 'Forbidden: Only organizers allowed') {
          return res.status(HttpStatus.FORBIDDEN).json({
            statusCode: HttpStatus.FORBIDDEN,
            message: 'Forbidden: Only organizers allowed',
          });
        }

        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: errorMessage,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Event role of role id retrieved successfully',
        data: result.unwrap(),
      });
    } catch (error) {
      this.slackService.sendError(`Event Service - Event role by id >>> GetEventRolesByIdController: ${error.message}`);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}