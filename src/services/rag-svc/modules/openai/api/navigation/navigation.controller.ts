import { Body, Controller, HttpStatus, Post, Res } from "@nestjs/common";
import { ApiBody, ApiTags } from "@nestjs/swagger";
import { OpenAINavigationService } from "./navigation.service";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { Response } from 'express';

@ApiTags('RAG Service - OpenAI')
@Controller('api/rag/agent')
export class OpenAINavigationController {
  // This controller is currently empty, but can be extended in the future
  // to handle specific routes or methods related to OpenAI navigation.
  constructor(
    private readonly openAINavigationService: OpenAINavigationService,
    private readonly slackService: SlackService,
  ) {
    // Constructor can be used to inject services if needed in the future.
  }

  @Post('/navigation')
  @ApiBody({
    description: 'Navigate through the OpenAI routes',
    type: String,
    required: true,
    schema: {
      properties: {
        query: { type: 'string', description: 'The query to navigate' },
        privateKey: { type: 'string', description: 'Private key for authentication' },
        previousID: { type: 'string', description: 'The previous route ID (optional)' },
      },
      required: ['query'],
    },
  })
  async navigation(
    @Res() res: Response,
    @Body('query') query: string, 
    @Body('privateKey') privateKey: string,
    @Body('previousID') previousID?: string,
  ) {
    if(!privateKey || privateKey !== process.env.OPENAI_USAGE_PRIVATE_KEY) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Private key is required',
      });
    }
    // This method will handle the navigation logic using OpenAINavigationService.
    try{
      const answer = await this.openAINavigationService.selectRoute(query, previousID);
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Navigation successful',
        data: answer,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Navigation failed',
        error: error.message,
      });
    }
  }
}