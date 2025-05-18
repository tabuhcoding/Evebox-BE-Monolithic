import { Module } from "@nestjs/common";
import { RetrieverController } from "./modules/retriever/retriever.controller";
import { RetrieverService } from "./modules/retriever/retriever.service";
import { RAGController } from "./modules/rag/rag.controller";
import { RAGService } from "./modules/rag/rag.service";
import { NavigationService } from "./modules/navigation/navigation.service";
import { NavigationController } from "./modules/navigation/navigation.controller";
import { ContentController } from "./modules/content/content.controller";
import { ContentService } from "./modules/content/content.service";
import { DescriptionGenerateController } from "./modules/descriptionGenerate/descriptionGenerate.controller";
import { DescriptionGenerateService } from "./modules/descriptionGenerate/descriptionGenerate.service";
import { EmbeddingWrapperService } from "./modules/embedding_wrapper/embedding_wrapper.service";
import { VectorStoreCohereService } from "./modules/vector_store/vector_store.cohere";
import { VectorStoreGeminiService } from "./modules/vector_store/vector_store.gemini";
import { VectorStoreService } from "./modules/vector_store/vector_store.service";
import { ContentRepositoryImpl } from "./repository/content.impl";
import { PrismaAIModule } from "./database/prisma-ai/prisma.module";

@Module({
  imports: [ PrismaAIModule ],
  controllers: [RetrieverController, RAGController, NavigationController, ContentController, DescriptionGenerateController],
  providers: [
    EmbeddingWrapperService,
    VectorStoreCohereService,
    VectorStoreGeminiService,
    VectorStoreService,
    RetrieverService,
    RAGService,
    NavigationService,
    ContentService,
    DescriptionGenerateService,
    { provide: 'ContentRepository', useClass: ContentRepositoryImpl },
  ],
})
export class RagSvcModule {}