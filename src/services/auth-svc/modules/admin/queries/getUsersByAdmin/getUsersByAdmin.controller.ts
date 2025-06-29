import { Controller, Get, Query, Res, HttpStatus, UseGuards, Request } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { GetUsersByAdminService } from "./getUsersByAdmin.service";
import { UserDataResponse } from "./getUsersByAdmin-response.dto";
import { GetUsersByAdminDto } from "./getUsersByAdmin.dto";

@ApiTags('Auth Service - User')
@Controller('api/admin/user')
export class GetUsersByAdminController {
  constructor(
    private readonly getUsersByAdminService: GetUsersByAdminService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get('/')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get events by admin with filters and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
    type: UserDataResponse
  })
  async getUsersByAdmin(
    @Query() filters: GetUsersByAdminDto,
    @Res() res: Response,
    @Request() req
  ) {
    try {
      const email = req?.user?.email;
      const page = filters.page >> 0 || 1;
      const limit = filters.limit >> 0 || 10;

      const result = await this.getUsersByAdminService.execute({
        ...filters,
        page,
        limit
      }, email);

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      const data = result.unwrap();

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Users retrieved successfully',
        data: {
          data: data[0],
          pagination: data[1],
        }
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}