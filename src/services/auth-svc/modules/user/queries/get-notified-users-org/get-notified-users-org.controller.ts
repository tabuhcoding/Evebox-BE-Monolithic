import { Controller, Get, Param, HttpStatus, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { Response } from 'express';
import { GetUsersNotifiedByOrgService } from './get-notified-users-org.service';
import { GetNotifiedUsersResponse } from './get-notified-users-org.dto';

@ApiTags('User')
@Controller('api/user')
export class GetUsersNotifiedByOrgController {
  constructor(private readonly getUsersNotifiedByOrgService: GetUsersNotifiedByOrgService) {}

  @UseGuards(JwtAuthGuard)
  @Get('notification/org/:orgId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get users who turned on notifications for an organizer' })
  @ApiResponse({ status: 200, type: GetNotifiedUsersResponse })
  async getNotifiedUsers(@Param('orgId') orgId: string, @Res() res: Response) {
    const result = await this.getUsersNotifiedByOrgService.execute(orgId);

    if (result.isErr()) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: 500,
        message: result.unwrapErr().message,
      });
    }

    return res.status(HttpStatus.OK).json({ data: result.unwrap() });
  }
}
