import { Body, Controller, Post, Request, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from "@nestjs/swagger";
import { DescriptionGenerateService } from "./description-generate.service";
import { DescriptionGenerateDTO } from "./description-generate.dto";
import { Response } from 'express';
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";

@ApiTags('RAG Service - OpenAI')
@Controller('api/rag/agent')
export class DescriptionGenerateController {
  // This controller is currently empty, but can be extended in the future
  // to handle specific routes or methods related to OpenAI description generation.
  constructor(
    private readonly slackService: SlackService,
    private readonly descriptionGenerateService: DescriptionGenerateService) {}

  @Post('/description-generate')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiBody({
    description: 'Generate HTML description for an event',
    type: DescriptionGenerateDTO,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Description generated successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Description generated successfully' },
        data: { type: 'string' },
        previousID: { type: 'string', example: 'previous-event-id' },
      },
    },
  })
  async generateDescription(
    @Res() res: Response,
    @Body() dto: DescriptionGenerateDTO,
    @Request() req: any,
  ) {
    // if (dto.privatekey !== process.env.OPENAI_USAGE_PRIVATE_KEY) {
    //   return res.status(403).json({
    //     statusCode: 403,
    //     message: 'Forbidden: Invalid private key',
    //   });
    // }

    try{
      const result = await this.descriptionGenerateService.generateDescription(dto, req.user.email);
      if (!result) {
        return res.status(400).json({
          statusCode: 400,
          message: 'Failed to generate description',
        });
      }
      return res.status(200).json({
        statusCode: 200,
        message: 'Description generated successfully',
        data: result[0],
        previousID: result[1],
      });
    } catch (error) {
      await this.slackService.sendError(`Error in DescriptionGenerateController: ${error.message}`);
      return res.status(500).json({
        statusCode: 500,
        message: 'Internal server error',
      });
    }
  }
}