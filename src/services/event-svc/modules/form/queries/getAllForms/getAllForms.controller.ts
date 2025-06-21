import { Controller, Get, Res, Req, HttpStatus, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { ApiOperation, ApiResponse, ApiTags, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { GetAllFormsService } from './getAllForms.service';
import { GetAllFormsResponseDto } from './getAllFroms-response.dto';

@ApiTags('Org - Showing')
@Controller('api/org/showing')
export class GetAllFormsController {
  constructor(private readonly getAllFormsService: GetAllFormsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('form/all')
  @ApiOperation({ summary: 'Get all forms (not deleted) for organizer' })
  @ApiBearerAuth('access-token')
  // @ApiQuery({ name: 'organizerId', type: String, description: 'Organizer ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Forms retrieved successfully', type: GetAllFormsResponseDto })
  async getAllForms( @Req() req: any, @Res() res: Response) {
    const user = req.user;

    const result = await this.getAllFormsService.execute(user.email);
    if (result.isErr()) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: result.unwrapErr().message,
      });
    }
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Forms retrieved successfully',
      data: { forms: result.unwrap() },
    });
  }
}

