import { Controller, Res, Request, HttpStatus, Body, UseGuards, Post } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiBody } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { CheckInTicketByQrService } from "./checkInTicketByQr.service";
import { CheckInTicketByQrDto } from "./checkInTicketByQr.dto";
import { CheckInTicketByQrResponseDto } from "./checkInTicketByQr-response.dto";

@ApiTags('Booking Service - Booking')
@Controller('api/booking')
export class CheckInTicketByQrController {
  constructor(private readonly checkInTicketByQrService: CheckInTicketByQrService) { }

  @UseGuards(JwtAuthGuard)
  @Post('/checkin-qr')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Checkin ticket' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ticket checked in successfully by QR', type: CheckInTicketByQrResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })

  async execute(
    @Body() dto: CheckInTicketByQrDto,
    @Request() req, 
    @Res() res: Response
  ) {
    try {
      const user = req.user;
      const result = await this.checkInTicketByQrService.execute(dto.encryptedQrData, user.email);

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