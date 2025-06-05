import { Controller, Get, Res, Request, HttpStatus, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { GetEventOfOrgService } from "./getEventOfOrg.service";
import { EventOrgFrontDisplayResponse } from "./getEventOfOrg-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Organizer - Event')
@Controller('api/org/event')
export class GetEventOfOrgController {
  constructor(
    private readonly getEventOfOrgService: GetEventOfOrgService,
    private readonly slackService: SlackService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('/')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all Event Of Organizer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event Of Organizer retrieved successfully',
    type: EventOrgFrontDisplayResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getEventOfOrg(
    @Request() req, 
    @Res() res: Response,
  ) {
    try {
      const email = req.user?.email;
      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      const result = await this.getEventOfOrgService.execute(email);
      console.log("🚀 ~ GetEventOfOrgController ~ result:", result)
      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: `Event of org ${email} retrieved successfully`,
        data: result.unwrap(),
      });
    } catch (error) {
      this.slackService.sendError(`Event Service - Event of org >>> GetEventOfOrgController: ${error.message}`);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}