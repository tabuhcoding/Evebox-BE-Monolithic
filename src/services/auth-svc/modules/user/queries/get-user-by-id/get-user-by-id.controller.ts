import { Controller, Get, HttpStatus, Res, Param } from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiOperation, ApiNotFoundResponse, ApiOkResponse } from "@nestjs/swagger";
import { ErrorHandler } from "src/shared/exceptions/error.handler";
import { UserResponse } from "./get-user-by-id-response.dto";
import { GetUserByIdService } from "./get-user-by-id.service";

@ApiTags('Auth Service - User')
@Controller('api/user')
export class GetUserByIdController {
  constructor(
    private readonly getUserByIdService: GetUserByIdService
  ) { }

  @Get('/:id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Fetch user details by ID'
  })
  @ApiOkResponse({
    description: 'User details fetched successfully',
    type: UserResponse
  })
  @ApiNotFoundResponse({
    description: 'User not found'
  })
  async getUserById(
    @Param('id') id: string,
    @Res() res: Response
  ) {
    try {
      const userData = await this.getUserByIdService.execute(id);

      if (userData.isErr()) {
        return res.status(404).json(ErrorHandler.notFound('User not found'));
      }

      return res.status(HttpStatus.OK).json({
        statusCode: 200,
        message: 'User details fetched successfully',
        data: {
          ...userData.unwrap(),
        }
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}