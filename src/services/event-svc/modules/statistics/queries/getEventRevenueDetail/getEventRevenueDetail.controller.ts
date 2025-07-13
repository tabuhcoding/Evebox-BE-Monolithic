import { Controller, Get, Param, Res, HttpStatus, UseGuards, Request } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetEventRevenueDetailService } from "./getEventRevenueDetail.service";
import { EventRevenueDetailResponseDto } from "./getEventRevenueDetail-response.dto";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";

@ApiTags('Event Service - Admin - Statistics')
@Controller('api/admin')
export class GetEventRevenueDetailController {
  constructor(private readonly getEventRevenueDetailService: GetEventRevenueDetailService) { }

  @UseGuards(JwtAuthGuard)
  @Get('/revenue/:orgId/:eventId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get event revenue detail' })
  @ApiParam({ name: 'orgId', example: "dattruong01082@gmail.com", description: "The gmail stands for ID of the organizer" })
  @ApiParam({ name: 'eventId', example: 123123, description: "The ID of the event" })
  @ApiResponse({ status: HttpStatus.OK, description: 'Event revenue detail retrieved successfully', type: EventRevenueDetailResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'You do not have permission to get org revenue' })
  async execute(
    @Param('orgId') orgId: string,
    @Param('eventId') eventId: number,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const email = req.user?.email;

      const parseEventId = parseInt(eventId.toString());

      const result = await this.getEventRevenueDetailService.execute(email, orgId, parseEventId);

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

  @UseGuards(JwtAuthGuard)
  @Get('/revenue-V2/:orgId/:eventId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get event revenue detail' })
  @ApiParam({ name: 'orgId', example: "dattruong01082@gmail.com", description: "The gmail stands for ID of the organizer" })
  @ApiParam({ name: 'eventId', example: 123123, description: "The ID of the event" })
  @ApiResponse({ status: HttpStatus.OK, description: 'Event revenue detail retrieved successfully', type: EventRevenueDetailResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'You do not have permission to get org revenue' })
  async executeV2(
    @Param('orgId') orgId: string,
    @Param('eventId') eventId: number,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const email = req.user?.email;

      const parseEventId = parseInt(eventId.toString());

      const result = await this.getEventRevenueDetailService.executeV2(email, orgId, parseEventId);

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