import { Controller, Get, Query, Res, HttpStatus, UseGuards, Request, Param } from '@nestjs/common';
import e, { Response } from 'express';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { GetAllShowingDetailOfEventService } from './getAllShowingDetailOfEvent.service';
import { GetAllShowingDetailOfEventResponseDto } from './getAllShowingDetailOfEvent-response.dto';

@ApiTags('Event Service - Organizer - Showing')
@Controller('api/org/showing')
export class GetAllShowingDetailOfEventController {
  constructor(private readonly getAllShowingDetailOfEventService: GetAllShowingDetailOfEventService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/:eventId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all showing & ticketType of Event of Organizer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get all showing of Event of Organizer',
    type: GetAllShowingDetailOfEventResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getShowing(
    @Param('eventId') eventId: number,
    @Request() req,
    @Res() res: Response,
  ) {
    try{
      const email = req.user.email;
      const result = await this.getAllShowingDetailOfEventService.findAll(email, parseInt(eventId.toString()));
      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Get all showing of Event of Organizer successfully',
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