import { Controller, Get, Query, Res, HttpStatus, UseGuards, Request } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { GetEventsByAdminService } from "./getEvents.service";
import { EventDataResponse } from "./getEvents-response.dto";

@ApiTags('Event Service - Admin - Event Management')
@Controller('api/admin/event')
export class GetEventsByAdminController {
  constructor(private readonly getEventsService: GetEventsByAdminService) { }

  @UseGuards(JwtAuthGuard)
  @Get('/')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get events with filters and pagination' })
  @ApiQuery({ name: 'isApproved', required: false, description: 'Filter events by approval status', type: Boolean })
  @ApiQuery({ name: 'isDeleted', required: false, description: 'Filter events by deletion status', type: Boolean })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination', type: Number, default: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of events per page', type: Number, default: 10 })
  @ApiQuery({ name: 'createdFrom', required: false, description: 'Filter events created after this date', type: String })
  @ApiQuery({ name: 'createdTo', required: false, description: 'Filter events created before this date', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Events retrieved successfully',
    type: EventDataResponse,
  })
  async getEvents(
    @Query() filters: any,
    @Res() res: Response,
    @Request() req
  ) {
    try {
      const user = req.user;
      const page = filters.page || 1;
      const limit = filters.limit || 10;
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

      const totalCount = await this.getEventsService.count(filters);
      const totalPages = Math.ceil(totalCount / limit);
      const currentPage = page;

      const nextPage = currentPage < totalPages ? currentPage + 1 : null;

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Events retrieved successfully',
        data: {
          data: data,
          meta: {
            totalCount,
            currentPage,
            nextPage,
            limit: filters.limit || 10,
            totalPages,
          },
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