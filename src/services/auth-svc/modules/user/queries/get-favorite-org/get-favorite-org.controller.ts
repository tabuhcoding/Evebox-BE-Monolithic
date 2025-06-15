import { GetFavoriteOrgService } from './get-favorite-org.service';
import { GetFavoriteOrgResponse } from './get-favorite-org.response';
import { Controller, Get, HttpStatus, Query, Req, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PaginationQuery } from 'src/shared/constants/pagination';

@ApiTags('Auth Service - User')
@Controller('api/user')
export class GetFavoriteOrgController {
  constructor(
    private readonly getFavoriteOrgService: GetFavoriteOrgService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('favorite/org')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all favorited organizer IDs' })
  @ApiResponse({ status: 200, type: GetFavoriteOrgResponse })
  async getFavoriteOrg(
    @Req() req: any, 
    @Res() res: Response,
    @Query() pagination: PaginationQuery
  ) {
    const email = req.user.email;
    const result = await this.getFavoriteOrgService.execute(email,
      {
        page: pagination.page >> 0 || 1,
        limit: pagination.limit >> 0 || 10,
      }
    );

    if (result.isOk()) {
      return res.status(HttpStatus.OK).json({
        statusCode: 200,
        message: 'Get favorite organizers successfully',
        data: result.unwrap(),
      });
    }

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      message: result.unwrapErr().message,
      data: [],
    });
  }
}
