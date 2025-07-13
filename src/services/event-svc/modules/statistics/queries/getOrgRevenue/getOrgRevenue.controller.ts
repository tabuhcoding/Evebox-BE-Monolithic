import { Controller, Get, Query, Res, HttpStatus, UseGuards, Request } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetOrgRevenueService } from "./getOrgRevenue.service";
import { OrganizerRevenueResponseDto } from "./getOrgRevenue-response.dto";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { PaginationQuery } from "src/shared/constants/pagination";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Admin - Statistics')
@Controller('api/admin')
export class GetOrgRevenueController {
  constructor(
    private readonly getOrgRevenueService: GetOrgRevenueService,
    private readonly slackService: SlackService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get('/revenue')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get revenue combine org' })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Organizer revenue retrieved successfully', type: OrganizerRevenueResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'You do not have permission to get org revenue' })
  async execute(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Query('search') search: string,
    @Query() paginationQuery: PaginationQuery,
    @Res() res: Response,
    @Request() req,
  ) {
    try {
      const email = req.user?.email;

      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      const pagination: PaginationQuery = {
        page: paginationQuery.page >> 0 || 1,
        limit: paginationQuery.limit >> 0 || 10,
      };

      const result = await this.getOrgRevenueService.execute(email, pagination, fromDate, toDate, search);

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
      await this.slackService.sendError(`Error in Event Svc >> Admin - Statistics >> GetOrgRevenueController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/revenue-v2')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get revenue combine org' })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Organizer revenue retrieved successfully', type: OrganizerRevenueResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'You do not have permission to get org revenue' })
  async executeV2(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Query('search') search: string,
    @Query() paginationQuery: PaginationQuery,
    @Res() res: Response,
    @Request() req,
  ) {
    try {
      const email = req.user?.email;

      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      const pagination: PaginationQuery = {
        page: paginationQuery.page >> 0 || 1,
        limit: paginationQuery.limit >> 0 || 10,
      };

      const result = await this.getOrgRevenueService.execueWithDB(email, pagination, fromDate, toDate, search);

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
      await this.slackService.sendError(`Error in Event Svc >> Admin - Statistics >> GetOrgRevenueController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}