import { Controller, Get, Request, Res, HttpStatus, UseGuards } from '@nestjs/common';
import { GetEventFrontDisplayService } from './getEventFrontDisplay.service';
import { JwtOptionalGuard } from 'src/shared/guard/jwt-optional.guard';
import { Response } from 'express';
import { ApiOperation, ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetEventFrontDisplayResponse } from './getEventFrontDisplay-response.dto';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';

@ApiTags('Event Service - Event')
@Controller('api/event')
export class GetEventFrontDisplayController {
  constructor(
    private readonly frontDisplayService: GetEventFrontDisplayService,
    private readonly slackService: SlackService
  ) { }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtOptionalGuard)
  @Get('/front-display')
  @ApiOperation({ summary: 'Get front display data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Front display data retrieved successfully',
    type: GetEventFrontDisplayResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Fetch front display data failed',
  })
  async getFrontDisplay(@Res() res: Response, @Request() req) {
    try {
      const result = await this.frontDisplayService.execute();

      if (result.isErr()) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({
            statusCode: HttpStatus.BAD_REQUEST,
            message: result.unwrapErr().message,
          });
      }

      const data = result.unwrap();
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Front display data retrieved successfully',
        data,
      });
    } catch (error) {
      this.slackService.sendError(`Event Service - Event front display >>> GetEventFrontDisplayController: ${error.message}`);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}
