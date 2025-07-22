import { Controller, Get, Res, Query, HttpStatus, UseGuards, Request, Body, Post } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { GetOrgRevenueChartService } from "./getOrgRevenueChart.service";
import { RevenueSummaryResponseDto } from "./getOrgRevenueChart-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { GetSummaryWithAI } from "../../../event/queries/getEventSummary/getEventSummary.dto";

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

  @Post('/revenue-chart-ai')
  // @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get revenue data combine org for chart' })
  @ApiBody({ type: GetSummaryWithAI })
  @ApiResponse({ status: HttpStatus.OK, description: 'Organizer revenue retrieved successfully', type: RevenueSummaryResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'You do not have permission to get org revenue' })
  async executeAI(
    @Body() body: GetSummaryWithAI,
    @Request() req,
    @Res() res: Response
  ) {
    try {
      const result = await this.getOrgRevenueChartService.executeAI("baobao11062003@gmail.com", body.query || "");

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

  @Get('/revenue-chart-ai')
  @ApiOperation({ summary: 'Get AI Analyst data for revenue chart' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page', example: 10 })
  @ApiResponse({ status: HttpStatus.OK, description: 'AI Analyst data retrieved successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'You do not have permission to get AI Analyst data' })
  async getAIAnalystData(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    // @Request() req,
    @Res() res: Response
  ) {
    try {
      // const email = req.user?.email;

      const pagination = {
        page: page >> 0 || 1,
        limit: limit >> 0 || 10,
      };

      const result = await this.getOrgRevenueChartService.getAIAnalyst(pagination);

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'AI Analyst data retrieved successfully',
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