import { Module } from "@nestjs/common";
import { OpenAIVectorStoreService } from "./core-embedding/vector-store.service";
import { OpenAINavigationService } from "./api/navigation/navigation.service";
import { OpenAIEmbeddingWrapperService } from "./core-embedding/embedding-wrapper";
import { EventDocumentBuilder } from "./core-embedding/event-document.builder";
import { CreateResponseService } from "./provider/create-response.service";
import { OpenAINavigationController } from "./api/navigation/navigation.controller";
import { DescriptionGenerateService } from "./api/description-generate/description-generate.service";
import { DescriptionGenerateController } from "./api/description-generate/description-generate.controller";
import { AuthSvcModule } from "src/services/auth-svc/auth-svc.module";
import { CheckUpdateEventService } from "./api/checkUpdateEvent/checkUpdateEvent.service";

@Module({
  imports: [ AuthSvcModule ],
  controllers: [
    OpenAINavigationController,
    DescriptionGenerateController,
  ],
  providers: [
    OpenAIVectorStoreService,
    OpenAIEmbeddingWrapperService,
    EventDocumentBuilder,
    CreateResponseService,

    OpenAINavigationService,
    DescriptionGenerateService,
    CheckUpdateEventService
  ],
  exports: [
    OpenAIVectorStoreService,
    CheckUpdateEventService
  ]
})
export class OpenAIModule {
  // This module is currently empty, but can be extended in the future
  // to include specific providers or controllers related to OpenAI services.
}