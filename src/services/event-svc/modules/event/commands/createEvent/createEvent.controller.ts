import { Controller, Request, Res, HttpStatus, Post, Body, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreateEventService } from "./createEvent.service";
import { CreateEventDto } from "./createEvent.dto";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { CreateEventResponseDto } from "./createEvent-response.dto";

@ApiTags('Event Service - Event')
@Controller('api/org/event')
export class CreateEventController {
  constructor(private readonly createEventService: CreateEventService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Event created successfully', type: CreateEventResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async createEvent(
    @Body() createEventDto: CreateEventDto,
    @Request() req: any,
    @Res() res: Response,
  ) {
    try{
      const user = req.user;
      if (!user || !user.email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      const result = await this.createEventService.execute(createEventDto, user.email);
      
      if (result.isErr()) {
        console.error('Error in CreateEventService.execute:', result.unwrapErr().message);
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.CREATED).json({
        statusCode: HttpStatus.CREATED,
        message: 'Event created successfully',
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
