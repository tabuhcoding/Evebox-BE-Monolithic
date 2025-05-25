import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorHandler } from 'src/shared/exceptions/error.handler';
import { ShowingResponseDto } from './getShowingDetail-response.dto';
import { getShowingDetailService } from './getShowingDetail.service';

@ApiTags('Showing')
@Controller('api/showing')
export class getShowingDetailController {
  constructor(private readonly getShowingDetailService: getShowingDetailService) {}

  @Get('/')
  @ApiOperation({ summary: 'Get showing data' })
  @ApiQuery({
    name: 'showingId',
    required: true,
    example: '1041811243642',
    description: 'The ID of the showing to retrieve',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Showing data retrieved successfully',
    type: ShowingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Event not found',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getShowing(@Query('showingId') showingId: string, @Res() res: Response) {
    const result = await this.getShowingDetailService.execute(showingId);

    if (result.isErr()) {
      const error = result.unwrapErr();
      return res
        .status(error.message === "Showing not found." ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST)
        .json(error.message === "Showing not found." ? ErrorHandler.notFound(result.unwrapErr().message) : ErrorHandler.badRequest(result.unwrapErr().message));
    }

    const data = result.unwrap();
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Showing data retrieved successfully',
      data,
    });
  }
}