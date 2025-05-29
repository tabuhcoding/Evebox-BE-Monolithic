import { Controller, Delete, Request, Res, HttpStatus, UseGuards, Param } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiParam, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteTicketTypeService } from "./deleteTicketType.service";
import { DeleteTicketTypeResponseDto } from "./deleteTicketType-response.dto";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Ticket type')
@Controller('api/org/ticketType')
export class DeleteTicketTypeController {
  constructor(
    private readonly deleteTicketTypeService: DeleteTicketTypeService,
    private readonly slackService: SlackService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a ticket type' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ticket type deleted successfully', type: DeleteTicketTypeResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async deleteTicketType(
    @Param('id') id: string,
    @Res() res: Response,
    @Request() req: any,
  ) {
    try {
      if (!id) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Showing id is required',
        });
      }

      const email = req.user?.email;

      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      const result = await this.deleteTicketTypeService.execute(id, email);
      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Ticket type deleted successfully',
        data: result.unwrap(),
      });
    } catch (error) {
      this.slackService.sendError(`EventSvc - Showing >>> DeleteTicketTypeController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}