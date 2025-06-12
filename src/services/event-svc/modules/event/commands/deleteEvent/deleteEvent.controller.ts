import { Controller, Request, Res, HttpStatus, UseGuards, Param, Delete } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { DeleteEventService } from "./deleteEvent.service";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { DeleteEventResponseDto } from "./deleteEvent-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Organizer - Event')
@Controller('api/org/event')
export class DeleteEventController {
  constructor(
    private readonly deleteEventService: DeleteEventService,
    private readonly slackService: SlackService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', example: 123123, description: "The ID of the event" })
  @ApiOperation({ summary: 'Delete an event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Event deleted successfully', type: DeleteEventResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async deleteEvent(
    @Param('id') id: number,
    @Res() res: Response,
    @Request() req: any,
  ) {
    try {
      const email = req.user?.email;
      const result = await this.deleteEventService.execute(id, email);

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Event deleted successfully',
        data: result.unwrap(),
      });
    } catch (error) {
      await this.slackService.sendError(`EventSvc - Event >>> DeleteEventController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}