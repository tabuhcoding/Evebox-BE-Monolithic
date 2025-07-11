import { Controller, Get, Res, HttpStatus, UseGuards, Param, Request, Query } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { GetOrdersByShowingIdService } from "./getOrdersByShowingId.service";
import { GetOrdersResponse } from "./getOrdersByShowingId-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { PaginationQuery } from "src/shared/constants/pagination";

@ApiTags('Event Service - Organizer - Statistics')
@Controller('api/org/statistics')
export class GetOrdersByShowingIdController {
  constructor(
    private readonly getOrdersByShowingIdService: GetOrdersByShowingIdService,
    private readonly slackService: SlackService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('orders/:showingId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get orders of a showing by showing id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Orders retrieved successfully', type: GetOrdersResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async getOrders(@Res() res: Response,
    @Param('showingId') showingId: string,
    @Query() pagination: PaginationQuery,
    @Request() req,
  ){
    try {
      const email = req.user?.email;
      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      if (!showingId) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Showing ID is required',
        });
      }

      const result = await this.getOrdersByShowingIdService.execute(
        showingId,
        email,
        {
          page: pagination.page >> 0 || 1,
          limit: pagination.limit >> 0 || 10,
        }
      );

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Orders retrieved successfully',
        data: result.unwrap()[0],
        pagination: result.unwrap()[1],
      });
    } catch (error) {
      await this.slackService.sendError(`Error in GetOrdersByShowingIdController: ${error.message}`);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('tickets/:showingId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all tickets of a showing by showing id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tickets retrieved successfully', type: GetOrdersResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async getAllTickets(@Res() res: Response,
    @Param('showingId') showingId: string,
    @Request() req,
  ){
    try {
      const email = req.user?.email;
      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      if (!showingId) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Showing ID is required',
        });
      }

      const result = await this.getOrdersByShowingIdService.getAllTicketsByShowingId(showingId, req.user.email);
      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Tickets retrieved successfully',
        data: result.unwrap(),
      });
    } catch (error) {
      await this.slackService.sendError(`Error in GetOrdersByShowingIdController.getAllTickets: ${error.message}`);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}