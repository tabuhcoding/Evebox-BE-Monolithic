import { Controller, Request, Res, HttpStatus, Body, UseGuards, Put, Param } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { UpdateEventService } from "./updateEvent.service";
import { UpdateEventDto } from "./updateEvent.dto";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { UpdateEventResponseDto } from "./updateEvent-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Organizer - Event')
@Controller('api/org/event')
export class UpdateEventController {
  constructor(
    private readonly updateEventService: UpdateEventService,
    private readonly slackService: SlackService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', example: 123123, description: "The ID of the event" })
  @ApiOperation({ summary: 'Update an existing event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Event updated successfully', type: UpdateEventResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async updateEvent(
    @Body() updateEventDto: UpdateEventDto,
    @Request() req,
    @Res() res: Response,
    @Param('id') id: number,
  ) {
    try {
      const email = req.user?.email;
      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      const result = await this.updateEventService.execute(updateEventDto, email, Number(id));

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Event updated successfully',
        data: result.unwrap(),
      });
    } catch (error) {
      await this.slackService.sendError(`EventSvc - Event >>> UpdateEventController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}