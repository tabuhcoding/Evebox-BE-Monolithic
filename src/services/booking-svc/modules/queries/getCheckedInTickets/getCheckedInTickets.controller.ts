import { Controller, Get, Param, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { Request, Response } from 'express';
import { GetCheckedInTicketsService } from './getCheckedInTickets.service';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { GetCheckedInTicketsResponseDto } from './getCheckedInTickets-response.dto';

@ApiTags('Org - Checkin')
@Controller('api/org/checkin')
export class GetCheckedInTicketsController {
  constructor(private readonly service: GetCheckedInTicketsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('all/:showingId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all checked-in tickets of a showing' })
  @ApiParam({ name: 'showingId', required: true })
  @ApiResponse({ status: HttpStatus.OK, type: GetCheckedInTicketsResponseDto })
  async handle(
    @Param('showingId') showingId: string,
    @Res() res: Response
  ) {
    try {
      const result = await this.service.execute(showingId);

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Checked-in tickets retrieved successfully',
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
