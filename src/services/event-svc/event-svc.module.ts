// event-svc.module.ts
import { Module } from '@nestjs/common';
import { CategoriesRepositoryImpl } from './repository/categories/categories.impl';
import { EventsRepositoryImpl } from './repository/events/events.impl';
import { EventCategoriesRepositoryImpl } from './repository/eventCategories/eventCategories.impl';
import { GetAllEventDetailForRAGService } from './modules/event/queries/getAllEventDetailForRAG/getAllEventDetailForRAG.service';

@Module({
  controllers: [],
  providers: [
    GetAllEventDetailForRAGService,
    { provide: 'CategoriesRepository', useClass: CategoriesRepositoryImpl },
    { provide: 'EventsRepository', useClass: EventsRepositoryImpl },
    { provide: 'EventCategoriesRepository', useClass: EventCategoriesRepositoryImpl },
  ],
  exports: [GetAllEventDetailForRAGService],
})
export class EventSvcModule {}