import { Controller, Request, Res, HttpStatus, Param, UseGuards, Put, Body } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { CheckInTicketService } from "./checkInTicket.service";
import { CheckInTicketDto } from "./checkInTicket.dto";
import { CheckInTicketResponseDto } from "./checkInTicket-response.dto";


@ApiTags('Booking Service - Booking')
@Controller('api/booking/checkin')
export class CheckInTicketController {
  constructor(private readonly checkInTicketService: CheckInTicketService) {}

  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Checkin ticket' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ticket checked in successfully', type: CheckInTicketResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async execute(
    @Body() dto: CheckInTicketDto,
    @Request() req,
    @Param('id') id: string,
    @Res() res: Response
  ) {
    try {
      const user = req.user;

      const result = await this.checkInTicketService.execute(id, user.email, dto.eventId >> 0);

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Ticket checked in successfully',
        data: result.unwrap(),
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