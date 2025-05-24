import { Controller, Post, Body, Req, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { CreateFavoriteDto, CreateFavoriteResponse } from './create-favorite.dto';
import { AddToFavoriteService } from './create-favorite.service';
import { Response } from 'express';

@ApiTags('Auth Service - User')
@Controller('api/user')
export class AddToFavoriteController {
  constructor(private readonly favoriteService: AddToFavoriteService) {}

  @UseGuards(JwtAuthGuard)
  @Post('favorite')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add an event or organizer to favorites' })
  @ApiResponse({ status: 201, type: CreateFavoriteResponse })
  async addFavorite(
    @Body() dto: CreateFavoriteDto,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const email = req.user.email;
    const result = await this.favoriteService.execute(dto, email);

    if (result.isOk()) {
      return res.status(HttpStatus.CREATED).json({
        statusCode: 201,
        message: 'Favorite added successfully',
        data: { success: true },
      });
    }

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      message: result.unwrapErr().message,
      data: { success: false },
    });
  }
}
