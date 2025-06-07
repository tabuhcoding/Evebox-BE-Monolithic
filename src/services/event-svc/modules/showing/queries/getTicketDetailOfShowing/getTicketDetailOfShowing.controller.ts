import { Controller, Get, Param, Res, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TicketTypeDetailResponseDto } from './getTicketDetailOfShowing-response.dto';
import { GetTicketDetailOfShowingService } from './getTicketDetailOfShowing.service';

@ApiTags('Event Service - Admin - Showing Management')
@Controller('api/admin/showing')
export class GetTicketDetailOfShowingController {
  constructor(private readonly getTicketDetailOfShowingService: GetTicketDetailOfShowingService) { }

  @UseGuards(JwtAuthGuard)
  @Get('/:id/:ticketTypeId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get ticket detail of showing data of admin page' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Showing data retrieved successfully',
    type: TicketTypeDetailResponseDto,
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
    @Param('id') id: string,
    @Param('ticketTypeId') ticketTypeId: string,
    @Res() res: Response,
    @Req() req
  ) {
    try {
      const user = req?.user;

      const result = await this.getTicketDetailOfShowingService.execute(id, ticketTypeId, user.email);

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
      console.log("🚀 ~ getShowingAdminDetailController ~ error:", error)
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}