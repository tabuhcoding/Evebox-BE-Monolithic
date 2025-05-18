// import { Module } from "@nestjs/common";
// // import { VectorStoreCohereService } from "src/infrastructure/vector/vector_store.cohere";
// import { RetrieverController } from "./modules/retriever/retriever.controller";
// import { RetrieverService } from "./modules/retriever/retriever.service";
// import { RAGController } from "./modules/rag/rag.controller";
// import { RAGService } from "./modules/rag/rag.service";
// import { NavigationService } from "./modules/navigation/navigation.service";
// import { NavigationController } from "./modules/navigation/navigation.controller";
// // import { VectorStoreGeminiService } from "src/infrastructure/vector/vector_store.gemini";
// // import { VectorStoreService } from "src/infrastructure/vector/vector_store.service";
// // import { EmbeddingWrapperService } from "src/infrastructure/vector/embedding_wrapper.service";
// import { ContentController } from "./modules/content/content.controller";
// import { ContentService } from "./modules/content/content.service";
// import { ContentRepository } from "./modules/content/content.repository";
// import { DescriptionGenerateController } from "./modules/descriptionGenerate/descriptionGenerate.controller";
// import { DescriptionGenerateService } from "./modules/descriptionGenerate/descriptionGenerate.service";

// @Module({
//   imports: [],
//   controllers: [RetrieverController, RAGController, NavigationController, ContentController, DescriptionGenerateController],
//   providers: [
//     // EmbeddingWrapperService,
//     // VectorStoreCohereService,
//     // VectorStoreGeminiService,
//     // VectorStoreService,
//     RetrieverService,
//     RAGService,
//     NavigationService,
//     ContentService,
//     ContentRepository,
//     DescriptionGenerateService,
//   ],
// })
// export class RagModule {}