import { Controller, Post, Body } from "@nestjs/common";
import { DescriptionGenerateService } from "./descriptionGenerate.service";
import { CreateEventDto } from "./descriptionGenerate.dto";
import { ApiTags } from "@nestjs/swagger";


@ApiTags('RAG Service')
@Controller('rag/description-generate')
export class DescriptionGenerateController {
  constructor( private readonly descriptionGenerateService: DescriptionGenerateService) {}

  @Post('/')
  async createDescriptionGenerate(
    @Body() dto: CreateEventDto, 
  ) {
    try {
      const content = await this.descriptionGenerateService.askQuestion(dto);
      return { result: content };
    }
    catch (error) {
      return { error: error.message };
    }
  }
}