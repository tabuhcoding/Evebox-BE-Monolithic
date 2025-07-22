import { Controller, Get, Param, Res, HttpStatus, UseGuards, Request, Query } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetEventRevenueDetailService } from "./getEventRevenueDetail.service";
import { EventRevenueDetailResponseDto, EventRevenueDetailResponseDtoV2 } from "./getEventRevenueDetail-response.dto";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { PaginationQuery } from "src/shared/constants/pagination";

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
  @Get('/revenue-v2/:orgId/:eventId')
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

  @UseGuards(JwtAuthGuard)
  @Get('/revenue-event')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get revenue combine org' })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Organizer revenue retrieved successfully', type: EventRevenueDetailResponseDtoV2 })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'You do not have permission to get org revenue' })
  async executePg(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Query('search') search: string,
    @Query() paginationQuery: PaginationQuery,
    @Res() res: Response,
    @Request() req,
  ) {
    try {
      const email = req.user?.email;
      const role = req.user?.role;

      if (!email || role !== 1) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      const pagination: PaginationQuery = {
        page: paginationQuery.page >> 0 || 1,
        limit: paginationQuery.limit >> 0 || 0,
      };

      const result = await this.getEventRevenueDetailService.executeList(pagination, fromDate, toDate, search);

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      const [data, paginationResult] = result.unwrap();

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Organizer revenue retrieved successfully',
        data,
        pagination: paginationResult,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}