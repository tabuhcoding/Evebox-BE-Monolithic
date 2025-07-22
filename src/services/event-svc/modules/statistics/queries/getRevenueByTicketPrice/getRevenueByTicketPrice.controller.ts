import { Controller, Get, Res, HttpStatus, UseGuards, Request, Post, Body, Query } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetRevenueByTicketPriceService } from "./getRevenueByTicketPrice.service";
import { RevenueByTicketPriceResponseDto } from "./getRevenueByTicketPrice-response.dto";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { GetSummaryWithAI } from "../../../event/queries/getEventSummary/getEventSummary.dto";

@ApiTags('Event Service - Admin - Statistics')
@Controller('api/admin')
export class GetRevenueByTicketPriceController {
  constructor(
    private readonly getOrgRevenueByTicketPriceService: GetRevenueByTicketPriceService,
    private readonly slackService: SlackService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('/revenue-by-ticket-price')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get revenue by ticket price' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Revenue by ticket price retrieved successfully', type: RevenueByTicketPriceResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'You do not have permission to get org revenue' })
  async execute(
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

      const result = await this.getOrgRevenueByTicketPriceService.execute(email);

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Revenue by ticket price retrieved successfully',
        data: result.unwrap(),
      });
    } catch (error) {
      await this.slackService.sendError(`Error in Event Svc >> Admin - Statistics >> GetOrgRevenueByTicketPriceController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/revenue-by-ticket-price-V2')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get revenue by ticket price' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Revenue by ticket price retrieved successfully', type: RevenueByTicketPriceResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'You do not have permission to get org revenue' })
  async executeV2(
    @Res() res: Response,
    @Request() req
  ) {
    try {
      const email = req.user?.role;

      if (!email || email !== 1) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      const result = await this.getOrgRevenueByTicketPriceService.executeV2();

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Revenue by ticket price retrieved successfully',
        data: result.unwrap(),
      });
    } catch (error) {
      await this.slackService.sendError(`Error in Event Svc >> Admin - Statistics >> GetOrgRevenueByTicketPriceController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }

  @Post('/revenue-ticket-ai')
  @ApiOperation({ summary: 'Get revenue data combine org for chart' })
  @ApiBody({ type: GetSummaryWithAI })
  @ApiResponse({ status: HttpStatus.OK, description: 'Organizer revenue retrieved successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'You do not have permission to get org revenue' })
  async executeAI(
    @Body() body: GetSummaryWithAI,
    @Res() res: Response
  ) {
    try {
      const result = await this.getOrgRevenueByTicketPriceService.executeAI(body.query || "");

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

  @Get('/revenue-province-ai')
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

      const result = await this.getOrgRevenueByTicketPriceService.getAIAnalyst(pagination);

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