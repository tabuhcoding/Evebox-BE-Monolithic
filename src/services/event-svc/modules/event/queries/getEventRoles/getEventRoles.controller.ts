import { Controller, Get, Request, UseGuards, HttpStatus, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { GetEventRolesService } from "./getEventRoles.service";
import { GetEventRolesResponseDto } from "./getEventRoles-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Event')
@Controller('api/event/role')
export class GetEventRolesController {
  constructor(
    private readonly getEventRolesService: GetEventRolesService,
    private readonly slackService: SlackService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get('/')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all event roles and their permissions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event Of Organizer retrieved successfully',
    type: GetEventRolesResponseDto,
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
  async getRoles(@Request() req: any, @Res() res: Response) {
    try {
      const email = req.user?.email;
      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      const result = await this.getEventRolesService.execute(req.user.email);

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
        message: 'Event roles retrieved successfully',
        data: result.unwrap(),
      });
    } catch (error) {
      await this.slackService.sendError(`Event Service - Event role >>> GetEventRolesController: ${error.message}`);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}