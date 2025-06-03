import { Controller, Get, Query, Res, HttpStatus, Req, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { EventSpecialRepsonseDto } from "./getEventSpecialManagement-response.dto";
import { GetEventSpecialManagementService } from "./getEventSpecialManagement.service";

@ApiTags('Event Service - Admin - Event Management')
@Controller('api/admin/event-special')
export class GetEventSpecialManagementController {
  constructor(private readonly getEventSpecialManagementService: GetEventSpecialManagementService) { }

  @UseGuards(JwtAuthGuard)
  @Get('/')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get special event in management page' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination', type: Number, default: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of events per page', type: Number, default: 10 })
  @ApiQuery({ name: 'isSpecial', required: false, description: 'Is event special?', type: Boolean})
  @ApiQuery({ name: 'isOnlyOnEve', required: false, description: 'Is event only on Eve?', type: Boolean})
  @ApiQuery({ name: 'categoryId', required: false, description: 'Category ID for filtering events', type: Number })
  @ApiQuery({ name: 'search', required: false, description: 'Search events by title or ID', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Showing data retrieved successfully',
    type: EventSpecialRepsonseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Showing not found',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async execute(
    @Query() filters: any,
    @Res() res: Response,
    @Req() req
  ) {
    try {
      const user = req?.user;
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const result = await this.getEventSpecialManagementService.execute(user.email, {
        ...filters,
        page,
        limit
      });

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      const data = result.unwrap();

      const totalCount = await this.getEventSpecialManagementService.count(filters);
      const totalPages = Math.ceil(totalCount / limit);
      const currentPage = page;

      const nextPage = currentPage < totalPages ? currentPage + 1 : null;

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Organizer revenue retrieved successfully',
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
      console.log("🚀 ~ GetEventSpecialManagementController ~ error:", error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}