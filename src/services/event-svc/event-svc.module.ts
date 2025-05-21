// event-svc.module.ts
import { Module } from '@nestjs/common';
import { CategoriesRepositoryImpl } from './repository/categories/categories.impl';
import { EventsRepositoryImpl } from './repository/events/events.impl';
import { EventCategoriesRepositoryImpl } from './repository/eventCategories/eventCategories.impl';
import { GetAllEventDetailForRAGService } from './modules/event/queries/getAllEventDetailForRAG/getAllEventDetailForRAG.service';
import { GetAllCategoriesController } from './modules/categories/queries/getAllCategories.controller';
import { GetAllCategoriesService } from './modules/categories/queries/getAllCategories.service';
import { GetEventFrontDisplayController } from './modules/event/queries/getEventFrontDisplay/getEventFrontDisplay.controller';
import { GetEventFrontDisplayService } from './modules/event/queries/getEventFrontDisplay/getEventFrontDisplay.service';
import { GetEventFDByIdsService } from './modules/event/queries/getEventFDByIds/getEventFDByIds.service';
import { GetEventFDByIdsController } from './modules/event/queries/getEventFDByIds/getEventFDByIds.controller';
import { GetRecommendedEventController } from './modules/event/queries/getRecommendEvent/getRecommendEvent.controller';
import { GetRecommendEventService } from './modules/event/queries/getRecommendEvent/getRecommendEvent.service';
import { GetEventsByIdsService } from './modules/event/queries/getEventsById/GetEventsByIds.service';

@Module({
  controllers: [
    // Categories
    GetAllCategoriesController,

    // Event
    GetEventFrontDisplayController,
    GetEventFDByIdsController,
    GetRecommendedEventController
  ],
  providers: [
    // Categories
    GetAllCategoriesService,

    // Event
    GetAllEventDetailForRAGService,
    GetEventFrontDisplayService,
    GetEventFDByIdsService,
    GetRecommendEventService,

    GetEventsByIdsService,

    // Repositories
    { provide: 'CategoriesRepository', useClass: CategoriesRepositoryImpl },
    { provide: 'EventsRepository', useClass: EventsRepositoryImpl },
    { provide: 'EventCategoriesRepository', useClass: EventCategoriesRepositoryImpl },
  ],
  exports: [GetAllEventDetailForRAGService, GetEventFrontDisplayService,GetEventsByIdsService],
})
export class EventSvcModule {}