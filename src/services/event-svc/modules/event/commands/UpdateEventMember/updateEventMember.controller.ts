import {
  Controller,
  Put,
  Query,
  Body,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { UpdateEventMemberService } from './updateEventMember.service';
import { UpdateEventMemberDto } from './updateEventMember.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Org - EventMember')
@Controller('org/member')
export class UpdateEventMemberController {
  constructor(private readonly updateService: UpdateEventMemberService) {}

  @UseGuards(JwtAuthGuard)
  @Put()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a member\'s role in an event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Member updated successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input or update failed' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async updateMember(
    @Query('eventId') eventIdRaw: string,
    @Body() dto: UpdateEventMemberDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const eventId = parseInt(eventIdRaw, 10);
      if (isNaN(eventId)) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid eventId',
        });
      }

      const result = await this.updateService.execute(eventId, dto, (req.user as any).email);

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json(result.unwrap());
    } catch (error) {
      console.error('[UpdateEventMemberController] Error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}
