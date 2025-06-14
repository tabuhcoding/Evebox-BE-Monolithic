import { Controller, Post, Body, Res, Request, HttpStatus, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { Response } from "express";
import { ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConnectFormService } from "./connectFormToShowing.service";
import { ConnectFormResponseDto } from "./connectFormToShowing-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { ConnectFormDto } from "./connectFormToShowing.dto";

@ApiTags('Event Service - Organizer - Form')
@Controller('api/org/showing')
export class ConnectFormController {
  constructor(
    private readonly connectFormService: ConnectFormService,
    private readonly slackService: SlackService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post('/connect-form')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Connect an existing form to a showing' })
  @ApiBody({ type: ConnectFormDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Form connected successfully', type: ConnectFormResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async connectForm(
    @Body() dto: ConnectFormDto,
    @Res() res: Response,
    @Request() req
  ) {
    try {
      const email = req.user?.email;

      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      const result = await this.connectFormService.execute(dto, email);

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Form connected successfully',
        data: result.unwrap(),
      });
    } catch (error) {
      await this.slackService.sendError(`Event Service - Form >>> ConnectFormController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}
