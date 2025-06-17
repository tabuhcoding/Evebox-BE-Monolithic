import { Controller, Get, Param, Res, HttpStatus, UseGuards, Request } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetOrgRevenueByIdService } from "./getOrgRevenueById.service";
import { RevenueByIdDto } from "./getOrgRevenueById-response.dto";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";

@ApiTags('Event Service - Admin - Statistics')
@Controller('api/admin')
export class GetOrgRevenueByIdController {
  constructor(private readonly getOrgRevenueByIdService: GetOrgRevenueByIdService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/revenue/:orgId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get revenue of an org' })
  @ApiParam({ name: 'orgId', example: "The gmail stands for ID of the organizer", description: "The ID of the organization" })
  @ApiResponse({ status: HttpStatus.OK, description: 'Organizer revenue retrieved successfully', type: RevenueByIdDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'You do not have permission to get org revenue' })
  async execute(
    @Param('orgId') orgId: string,
    @Request() req,
    @Res() res: Response
  ) {
    try {
      const email = req.user?.email;

      const result = await this.getOrgRevenueByIdService.execute(orgId, email);

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
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}