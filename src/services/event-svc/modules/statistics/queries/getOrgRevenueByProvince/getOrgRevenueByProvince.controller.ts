import { Controller, Get, Res, HttpStatus, UseGuards, Request, Body, Post, Query } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetOrgRevenueByProvinceService } from "./getOrgRevenueByProvince.service";
import { ProvinceRevenueResponseDto } from "./getOrgRevenueByProvince-response.dto";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { GetSummaryWithAI } from "../../../event/queries/getEventSummary/getEventSummary.dto";

@ApiTags('Event Service - Admin - Statistics')
@Controller('api/admin')
export class GetOrgRevenueByProvinceController {
  constructor(
    private readonly getOrgRevenueByProvinceService: GetOrgRevenueByProvinceService,
    private readonly slackService: SlackService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('/revenue-by-province')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get organizer revenue by province' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Organizer revenue by province retrieved successfully', type: ProvinceRevenueResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'You do not have permission to get org revenue' })
  async execute(
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

      const result = await this.getOrgRevenueByProvinceService.execute();

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Organizer revenue by province retrieved successfully',
        data: result.unwrap(),
      });
    } catch (error) {
      await this.slackService.sendError(`Event Service - Admin - Statistics >>> GetOrgRevenueByProvinceController: ${error.message}`);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/revenue-by-province-V2')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get organizer revenue by province' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Organizer revenue by province retrieved successfully', type: ProvinceRevenueResponseDto })
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

      const result = await this.getOrgRevenueByProvinceService.executeV3();

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Organizer revenue by province retrieved successfully',
        data: result.unwrap(),
      });
    } catch (error) {
      await this.slackService.sendError(`Event Service - Admin - Statistics >>> GetOrgRevenueByProvinceController: ${error.message}`);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }

  @Post('/revenue-province-ai')
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
      const result = await this.getOrgRevenueByProvinceService.executeAI(body.query || "");

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

      const result = await this.getOrgRevenueByProvinceService.getAIAnalyst(pagination);

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