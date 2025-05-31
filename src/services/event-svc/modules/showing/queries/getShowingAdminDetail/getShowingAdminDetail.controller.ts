import { Controller, Get, Param, Res, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ShowingAdminResponseDto } from './getShowingAdminDetail-response.dto';
import { GetShowingAdminDetailService } from './getShowingAdminDetail.service';

@ApiTags('Event Service - Admin - Showing Management')
@Controller('api/admin/showing')
export class GetShowingAdminDetailController {
  constructor(private readonly getShowingAdminDetailService: GetShowingAdminDetailService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get showing detail data of admin page' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Showing data retrieved successfully',
    type: ShowingAdminResponseDto,
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
  async getShowing(
    @Param('id') id: string,
    @Res() res: Response, 
    @Req() req
  ) {
    try {
      const user = req?.user;

      const result = await this.getShowingAdminDetailService.execute(id, user.email);

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Showing details retrieved successfully',
        data: result.unwrap(),
      });
    } catch (error) {
      console.log("🚀 ~ getShowingAdminDetailController ~ error:", error)
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}