import { Controller, Get, Post, Body } from "@nestjs/common";
import { ContentDto } from "./content.dto";
import { ContentService } from "./content.service";

@Controller('content')
export class ContentController {
  constructor( private readonly contentService: ContentService) {}

  @Post('/')
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

  @Get('/')
  async getAllContent() {
    try {
      const content = await this.contentService.getAllContent();
      return { result: content };
    } catch (error) {
      return { error: error.message };
    }
  }
}