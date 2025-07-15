import { Controller, Get, Res, Query, HttpStatus, UseGuards, Request } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { GetOrgRevenueChartService } from "./getOrgRevenueChart.service";
import { RevenueSummaryResponseDto } from "./getOrgRevenueChart-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Admin - Statistics')
@Controller('api/admin')
export class GetOrgRevenueChartController {
  constructor(
    private readonly getOrgRevenueChartService: GetOrgRevenueChartService,
    private readonly slackService: SlackService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('/revenue-chart-v2')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get revenue data combine org for chart' })
  @ApiQuery({ name: 'fromDate', required: false, type: String, example: '2025-04' })
  @ApiQuery({ name: 'toDate', required: false, type: String, example: '2025-05' })
  @ApiQuery({ name: 'filterType', required: false, enum: ['month', 'year'], description: "Group revenue by 'month' or 'year'. Default is 'month'." })
  @ApiResponse({ status: HttpStatus.OK, description: 'Organizer revenue retrieved successfully', type: RevenueSummaryResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'You do not have permission to get org revenue' })
  async execute(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Query('filterType') filterType: "month" | "year" = "month",
    @Request() req,
    @Res() res: Response
  ) {
    try {
      const email = req.user?.email;

      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      const result = await this.getOrgRevenueChartService.execute(email, fromDate, toDate, filterType);

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
      await this.slackService.sendError(`Error in Event Svc >> Admin - Statistics >> GetOrgRevenueChartController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/revenue-chart')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get revenue data combine org for chart' })
  @ApiQuery({ name: 'fromDate', required: false, type: String, example: '2025-04' })
  @ApiQuery({ name: 'toDate', required: false, type: String, example: '2025-05' })
  @ApiQuery({ name: 'filterType', required: false, enum: ['month', 'year'], description: "Group revenue by 'month' or 'year'. Default is 'month'." })
  @ApiResponse({ status: HttpStatus.OK, description: 'Organizer revenue retrieved successfully', type: RevenueSummaryResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'You do not have permission to get org revenue' })
  async executeV2(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Query('filterType') filterType: "month" | "year" = "month",
    @Request() req,
    @Res() res: Response
  ) {
    try {
      const email = req.user?.email;

      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      const result = await this.getOrgRevenueChartService.executeV2(email, fromDate, toDate, filterType);

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
      await this.slackService.sendError(`Error in Event Svc >> Admin - Statistics >> GetOrgRevenueChartController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}