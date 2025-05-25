import { Controller, Get, Query, Res, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ErrorHandler } from "src/shared/exceptions/error.handler";
import { GetFormOfShowingResponseDto } from "./getFomrOfShowing-response.dto";
import { getFormOfShowingService } from "./getFormOfShowing.service";

@ApiTags("Showing")
@Controller("api/showing")
export class getFormOfShowingController {
  constructor(private readonly getFormOfShowingService: getFormOfShowingService) { }

  @Get("/get-form")
  @ApiOperation({ summary: "Get form of showing" })
  @ApiQuery({ name: 'showingId', type: String, required: true, description: 'ID of the showing' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Form retrieved successfully', type: GetFormOfShowingResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async getForm(@Query('showingId') showingId: string, @Res() res: Response) {
    const result = await this.getFormOfShowingService.execute(showingId);
    if (result.isErr()) {
      const error = result.unwrapErr();
      return res
        .status(error.message === 'Form not found.' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST)
        .json(error.message === 'Form not found.' ? ErrorHandler.notFound(result.unwrapErr().message) : ErrorHandler.badRequest(result.unwrapErr().message));
    }

    const data = result.unwrap();
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Form retrieved successfully',
      data,
    });
  }
}
