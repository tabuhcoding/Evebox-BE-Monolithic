import { Module } from "@nestjs/common";
import { OpenAIVectorStoreService } from "./core-embedding/vector-store.service";
import { OpenAINavigationService } from "./api/navigation/navigation.service";
import { OpenAIEmbeddingWrapperService } from "./core-embedding/embedding-wrapper";
import { EventDocumentBuilder } from "./core-embedding/event-document.builder";
import { CreateResponseService } from "./chat-response/create-response.service";
import { OpenAINavigationController } from "./api/navigation/navigation.controller";

@Module({
  imports: [],
  controllers: [
    OpenAINavigationController,
  ],
  providers: [
    OpenAIVectorStoreService,
    OpenAIEmbeddingWrapperService,
    EventDocumentBuilder,
    CreateResponseService,

    OpenAINavigationService,
  ],
  exports: [
    OpenAIVectorStoreService,
  ]
})
export class OpenAIModule {
  // This module is currently empty, but can be extended in the future
  // to include specific providers or controllers related to OpenAI services.
}