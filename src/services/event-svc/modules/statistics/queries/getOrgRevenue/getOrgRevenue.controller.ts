import { Controller, Get, Query, Res, HttpStatus, UseGuards, Request } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetOrgRevenueService } from "./getOrgRevenue.service";
import { OrganizerRevenueResponseDto } from "./getOrgRevenue-response.dto";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";

@ApiTags('Event Service - Admin - Statistics')
@Controller('api/admin')
export class GetOrgRevenueController {
  constructor(private readonly getOrgRevenueService: GetOrgRevenueService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/revenue')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get revenue combine org' })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Organizer revenue retrieved successfully', type: OrganizerRevenueResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'You do not have permission to get org revenue' })
  async execute(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Query('search') search: string,
    @Res() res: Response,
    @Request() req,
  ) {
    try {
      const email = req.user?.email;

      const result = await this.getOrgRevenueService.execute(email, fromDate, toDate, search);

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
      console.error("🚀 ~ GetOrgRevenueController ~ error:", error)
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }  
  }
}