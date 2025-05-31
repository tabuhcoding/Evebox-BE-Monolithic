import { Controller, Get, Query, Res, HttpStatus, UseGuards, Request } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { GetShowingsByAdminService } from "./getShowings.service";
import { ShowingResponseDto } from "./getShowings-response.dto";

@ApiTags('Event Service - Admin - Showing Management')
@Controller('api/admin/showing')
export class GetShowingsByAdminController {
  constructor(private readonly getShowingsService: GetShowingsByAdminService) { }

  @UseGuards(JwtAuthGuard)
  @Get('/')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get showings with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination', type: Number, default: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of showings per page', type: Number, default: 10 })
  @ApiQuery({ name: 'startTime', required: false, description: 'Filter showings start time after this date', type: String })
  @ApiQuery({ name: 'endTime', required: false, description: 'Filter showings end time before this date', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Showings retrieved successfully',
    type: ShowingResponseDto,
  })
  async getShowings(
    @Query() filters: any,
    @Res() res: Response,
    @Request() req
  ) {
    try {
      const user = req.user;
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const result = await this.getShowingsService.execute({
        ...filters,
        page,
        limit
      }, user?.email);

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      const data = result.unwrap();

      const totalCount = await this.getShowingsService.count(filters);
      const totalPages = Math.ceil(totalCount / limit);
      const currentPage = page;

      const nextPage = currentPage < totalPages ? currentPage + 1 : null;

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Showings retrieve successfully',
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
        message: 'Internal server error'
      })
    }
  }
}