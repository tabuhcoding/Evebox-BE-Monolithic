import { Module } from "@nestjs/common";
import { ContentController } from "./modules/content/content.controller";
import { ContentService } from "./modules/content/content.service";
import { ContentRepositoryImpl } from "./repository/content.impl";
import { PrismaAIModule } from "./database/prisma-ai/prisma.module";
import { OpenAIModule } from "./modules/openai/openAI.module";

@Module({
  imports: [ PrismaAIModule, OpenAIModule ],
  controllers: [ContentController],
  providers: [
    ContentService,
    { provide: 'ContentRepository', useClass: ContentRepositoryImpl },
  ],
})
export class RagSvcModule {}