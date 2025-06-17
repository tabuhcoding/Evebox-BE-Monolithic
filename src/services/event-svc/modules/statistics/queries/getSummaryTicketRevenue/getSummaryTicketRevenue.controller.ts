import { Controller, Get, Request, Param, Res, UseGuards, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetSummaryTicketRevenueService } from "./getSummaryTicketRevenue.service";
import { SummaryTicketRevenueResponseDto } from "./getSummaryTicketRevenue-response.dto";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";

@ApiTags('Admin - Statistics')
@Controller('api/admin/')
export class GetSummaryTicketRevenueController {
  constructor(private readonly getSummaryTicketRevenueService: GetSummaryTicketRevenueService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/revenue/:orgId/:eventId/:showingId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get admin summary for a showing' })
  @ApiParam({ name: 'orgId', example: 'dattruong01082@gmail.com', description: 'The gmail stands for ID of the organizer' })
  @ApiParam({ name: 'eventId', example: 101, description: 'Event ID' })
  @ApiParam({ name: 'showingId', example: 'abc123', description: 'Showing ID' })
  @ApiResponse({ status: HttpStatus.OK, type: SummaryTicketRevenueResponseDto, description: 'Summary retrieved successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'You do not have permission to get org revenue' })
  async execute(
    @Param('orgId') orgId: string,
    @Param('eventId') eventId: number,
    @Param('showingId') showingId: string,
    @Res() res: Response,
    @Request() req
  ) {
    try {
      const email = req.user?.email;

      const parsedEventId = parseInt(eventId.toString());

      const result = await this.getSummaryTicketRevenueService.execute(email, showingId, parsedEventId, orgId);

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Organizer revenue retrieved successfully',
        data: result.unwrap(),
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}