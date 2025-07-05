import { Controller, Post, Query, Body, Req, ForbiddenException, UseGuards, BadRequestException, HttpStatus, Res } from '@nestjs/common';
import { AddEventMemberService } from './addEventMember.service';
import { AddEventMemberDto } from './addEventMember.dto';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { Request } from 'express';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AddEventMemberResponseDto } from './addEventMember-response.dto';

@ApiTags('Org - EventMember')
@Controller('org/member')
export class AddEventMemberController {
  constructor(private readonly service: AddEventMemberService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add member to event' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Added member successfully', type: AddEventMemberResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async addMember(
    @Query('eventId') eventIdRaw: string,
    @Body() dto: AddEventMemberDto,
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

      const user = req.user as { email: string };
      const result = await this.service.execute(eventId, dto, user.email);
      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      } 

      return res.status(HttpStatus.CREATED).json({
        statusCode: HttpStatus.CREATED,
        message: 'Member added successfully',
        data: result.unwrap(),
      });
      
    } catch (error) {
      const status = error?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        error?.response?.message ||
        error?.message ||
        'Internal server error';

      return res.status(status).json({
        statusCode: status,
        message,
      });
    }
  }
  }

