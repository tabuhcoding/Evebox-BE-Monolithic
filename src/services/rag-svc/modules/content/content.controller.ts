import { Controller, Get, Post, Body } from "@nestjs/common";
import { ContentDto } from "./content.dto";
import { ContentService } from "./content.service";
import { ApiTags } from "@nestjs/swagger";

@ApiTags('RAG Service - OpenAI')
@Controller('api/rag/agent')
export class ContentController {
  constructor( private readonly contentService: ContentService) {}

  @Post('/content')
  // @ApiQuery({ type: ContentDto })
  async createContent(
    @Body() dto:  ContentDto,
  ) {
    try {
      const content = await this.contentService.createContent(dto);
      return { result: content };
    }
    catch (error) {
      return { error: error.message };
    }
  }

  @Get('/content')
  async getAllContent() {
    try {
      const content = await this.contentService.getAllContent();
      return { result: content };
    } catch (error) {
      return { error: error.message };
    }
  }
}