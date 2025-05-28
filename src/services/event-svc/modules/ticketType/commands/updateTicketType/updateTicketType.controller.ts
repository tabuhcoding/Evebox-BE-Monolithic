import { Controller, Request, Res, HttpStatus, Body, UseGuards, Put, Param } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiParam, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateTicketTypeService } from "./updateTicketType.service";
import { UpdateTicketTypeDto } from "./updateTicketType.dto";
import { UpdateTicketTypeResponseDto } from "./updateTicketType-response.dto";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Ticket type')
@Controller('api/org/ticketType')
export class UpdateTicketTypeController {
  constructor(
    private readonly updateTicketTypeService: UpdateTicketTypeService,
    private readonly slackService: SlackService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', example: "10157860047763", description: "The ID of the ticket type" })
  @ApiOperation({ summary: 'Update an existing ticket type' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ticket type updated successfully', type: UpdateTicketTypeResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async updateTicketType(
    @Body() dto: UpdateTicketTypeDto,
    @Param('id') id: string,
    @Res() res: Response,
    @Request() req: any,
  ) {
    try {
      if (!id) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Ticket type id is required',
        });
      }

      const email = req.user.email;
      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      const result = await this.updateTicketTypeService.execute(dto, id, email);
      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Ticket type updated successfully',
        data: result.unwrap(),
      });
    } catch (error) {
      this.slackService.sendError(`Event Service - Ticket type >>> UpdateTicketTypeController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}