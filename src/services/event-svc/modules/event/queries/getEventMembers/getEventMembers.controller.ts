import { Controller, Get, Query, Param, Res, Request, HttpStatus, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { GetEventMembersService } from "./getEventMembers.service";
import { GetEventMembersQueryDto } from "./getEventMembers.dto";
import { GetEventMembersResponseDto } from "./getEventMembers-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Organizer - Event member')
@Controller('org/member')
export class GetEventMemberController {
  constructor(
    private readonly getEventMembersService: GetEventMembersService,
    private readonly slackService: SlackService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get('/:eventId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all members of an event (optionally filter by email)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of event members', type: GetEventMembersResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async getMembers(
    @Param('eventId') eventId: string,
    @Query() query: GetEventMembersQueryDto,
    @Request() req,
    @Res() res: Response
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

      const parsedEventId = parseInt(eventId, 10);
      if (isNaN(parsedEventId)) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid eventId',
        });
      }

      const result = await this.getEventMembersService.execute(parsedEventId, query, email);

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json(result.unwrap());
    } catch (error) {
      await this.slackService.sendError(`Event Service - Event member >>> GetEventMemberController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}