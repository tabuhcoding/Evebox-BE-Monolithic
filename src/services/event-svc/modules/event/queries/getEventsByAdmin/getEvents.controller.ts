import { Controller, Get, Query, Res, HttpStatus, UseGuards, Request } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { GetEventsByAdminService } from "./getEvents.service";
import { EventDataResponse } from "./getEvents-response.dto";
import { GetEventsAdminDto } from "./getEventsAdmin.dto";

@ApiTags('Event Service - Admin - Event Management')
@Controller('api/admin/event')
export class GetEventsByAdminController {
  constructor(private readonly getEventsService: GetEventsByAdminService) { }

  @UseGuards(JwtAuthGuard)
  @Get('/')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get events with filters and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Events retrieved successfully',
    type: EventDataResponse,
  })
  async getEvents(
    @Query() filters: GetEventsAdminDto,
    @Res() res: Response,
    @Request() req
  ) {
    try {
      const user = req.user;
      const page = filters.page >> 0 || 1;
      const limit = filters.limit >> 0 || 10;
      const result = await this.getEventsService.execute({
        ...filters,
        page,
        limit,
      }, user?.email);
      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      const data = result.unwrap();

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Events retrieved successfully',
        data: {
          data: data[0],
          pagination: data[1],
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}