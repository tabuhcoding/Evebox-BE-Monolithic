import { Controller, Request, Res, HttpStatus, Body, UseGuards, Put } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateEventAdminService } from './updateEventAdmin.service';
import { UpdateEventAdminDto } from './updateEventAdmin.dto';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { EventResponse } from './updateEventAdmin-response.dto';

@ApiTags('Event Service - Organizer - Event Management')
@Controller('api/admin/event')
export class UpdateEventAdminController {
  constructor(private readonly updateEventService: UpdateEventAdminService) {}

  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update an existing event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Event updated successfully', type: EventResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async updateEventAdmin(
    @Body() updateEventAdminDto: UpdateEventAdminDto,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const user = req.user;

      const result = await this.updateEventService.execute(updateEventAdminDto, parseInt(req.params.id), user?.email);

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Event updated successfully',
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