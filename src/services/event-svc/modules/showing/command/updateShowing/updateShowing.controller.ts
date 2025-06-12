import { Controller, Request, Res, HttpStatus, Body, UseGuards, Param, Put } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { UpdateShowingService } from "./updateShowing.service";
import { UpdateShowingDto } from "./updateShowing.dto";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { UpdateShowingResponseDto } from "./updateShowing-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Organizer - Showing')
@Controller('api/org/showing')
export class UpdateShowingController {
  constructor(
    private readonly updateShowingService: UpdateShowingService,
    private readonly slackService: SlackService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', example: "10157860047763", description: "The ID of the showing" })
  @ApiOperation({ summary: 'Update an existing showing' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Showing updated successfully', type: UpdateShowingResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async updateShowing(
    @Body() updateShowingDto: UpdateShowingDto,
    @Param('id') id: string,
    @Res() res: Response,
    @Request() req: any,
  ) {
    try {
      if(!id) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Showing id is required',
        });
      }
      
      const email = req.user.email;
      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      const result = await this.updateShowingService.execute(updateShowingDto, id, email);

      if (result.isErr()) {
        if (result.unwrapErr().message === 'Showing not found') {
          return res.status(HttpStatus.BAD_REQUEST).json({
            statusCode: HttpStatus.BAD_REQUEST,
            message: result.unwrapErr().message,
          });
        }
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Showing updated successfully',
        data: result.unwrap(),
      });
    } catch (error) {
      await this.slackService.sendError(`Event Service - Showing >>> UpdateShowingController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}