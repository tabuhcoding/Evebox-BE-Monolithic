import { Controller, Res, HttpStatus, Post, Request, Body, UseGuards, Param } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { CreateShowingDto } from "./createShowing.dto";
import { CreateShowingService } from "./createShowing.service";
import { CreateShowingResponseDto } from "./createShowing-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Showing')
@Controller('api/org/showing')
export class CreateShowingController {
  constructor(
    private readonly createShowingService: CreateShowingService,
    private readonly slackService: SlackService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post('/:eventId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new showing' })
  @ApiResponse({ status: 201, description: 'Showing created successfully', type: CreateShowingResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createEvent(
    @Body() dto: CreateShowingDto,
    @Param('eventId') eventId: number,
    @Res() res: Response,
    @Request() req
  ) {
    try {
      const email = req.user;
      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      const result = await this.createShowingService.execute(dto, Number(eventId), email);

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.CREATED).json({
        statusCode: HttpStatus.CREATED,
        message: 'Showing created successfully',
        data: result.unwrap(),
      });
    } catch (error) {
      this.slackService.sendError(`EventSvc - Showing >>> CreateShowingController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}