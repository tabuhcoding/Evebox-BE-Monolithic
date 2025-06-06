import { Controller, Get, Res, HttpStatus, UseGuards, Request, Param } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { GetEventOfOrgDetailService } from "./getEventOfOrgDetail.service";
import { EventOrgDetailResponse } from "./getEventOfOrgDetail-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Organizer - Event')
@Controller('api/org/event')
export class GetEventOfOrgDetailController {
  constructor(
    private readonly getEventDetailOfOrgService: GetEventOfOrgDetailService,
    private readonly slackService: SlackService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  @ApiParam({ name: 'eventId', example: 123123, description: "The ID of the event" })
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get Event Detail Of Organizer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event Detail Of Organizer retrieved successfully',
    type: EventOrgDetailResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getEventOfOrgDetail(
    @Request() req,
    @Param('id') eventId: number,
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

      if (!eventId) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Event id is required',
        });
      }

      const result = await this.getEventDetailOfOrgService.execute(Number(eventId), email);

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: `Detail data of event of org retrieved successfully`,
        data: result.unwrap(),
      });
    } catch (error) {
      this.slackService.sendError(`Event Service - Event detail of org >>> GetEventOfOrgDetailController: ${error.message}`);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}