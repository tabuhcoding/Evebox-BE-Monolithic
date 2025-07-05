import {
  Controller,
  Delete,
  Param,
  Query,
  Req,
  Res,
  HttpStatus,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { DeleteEventMemberService } from './deleteEventMember.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Org - EventMember')
@Controller('org/member')
export class DeleteEventMemberController {
  constructor(private readonly service: DeleteEventMemberService) {}

  @UseGuards(JwtAuthGuard)
  @Delete(':eventId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Soft delete an event member by eventId and email' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Member soft deleted successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input or already deleted' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async deleteMember(
    @Param('eventId') eventIdRaw: string,
    @Query('email') email: string,
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

      if (!email) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Email query param is required',
        });
      }

      const currentEmail = (req.user as any).email;
      const result = await this.service.execute(eventId, currentEmail, email);

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: result.unwrap().message,
      });
    } catch (error) {
      console.error('[DeleteEventMemberController]', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}
