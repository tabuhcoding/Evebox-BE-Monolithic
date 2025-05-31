import { Controller, Request, Res, HttpStatus, Post, Body, UseGuards, Param } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiParam, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { CreateTicketTypeService } from "./createTicketType.service";
import { CreateTicketTypeDto } from "./createTicketType.dto";
import { CreateTicketTypeResponseDto } from "./createTicketType-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Organizer - Ticket type')
@Controller('api/org/ticketType')
export class CreateTicketTypeController {
  constructor(
    private readonly createTicketTypeService: CreateTicketTypeService,
    private readonly slackService: SlackService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post('/create/:showingId')
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'showingId', example: "10157860047763", description: "The ID of the showing" })
  @ApiOperation({ summary: 'Create a new ticket type' })
  @ApiResponse({ status: 201, description: 'Ticket type created successfully', type: CreateTicketTypeResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createEvent(
    @Body() createTicketTypeDto: CreateTicketTypeDto,
    @Param('showingId') showingId: string,
    @Res() res: Response,
    @Request() req
  ) {
    try {
      const email = req.user.email;
      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      if (!showingId) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Showing id is required',
        });
      }

      const result = await this.createTicketTypeService.execute(createTicketTypeDto, showingId, email);

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.CREATED).json({
        statusCode: HttpStatus.CREATED,
        message: 'TicketType created successfully',
        data: result.unwrap(),
      });
    } catch (error) {
      this.slackService.sendError(`EventSvc - Ticket type >>> CreateTicketTypeController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}