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
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';
import { GetEventDetailRecommendController } from './modules/event/queries/getEventDetailRecommend/getEventDetailRecommend.controller';
import { GetEventDetailRecommendService } from './modules/event/queries/getEventDetailRecommend/getEventDetailRecommend.service';
import { BookingSvcModule } from '../booking-svc/booking.module';
import { GetEventDetailController } from './modules/event/queries/getEventDetail/getEventDetail.controller';
import { GetEventDetailService } from './modules/event/queries/getEventDetail/getEventDetail.service';
import { ShowingRepositoryImpl } from './repository/showing/showing.impl';
import { SeatmapRepositoryImpl } from './repository/seatmap/seatmap.impl';
import { SeatStatusRepositoryImpl } from './repository/seatStatus/seatStatus.impl';
import { TicketTypeRepositoryImpl } from './repository/ticketType/ticketType.impl';
import { CalculateShowingStatusService } from './modules/event/commands/calculateShowingStatus/calculateShowingStatus.service';
import { UserClickHistoryRepositoryImpl } from './repository/userClickHistory/userClickHistory.impl';
import { AuthSvcModule } from '../auth-svc/auth-svc.module';
import { GetEventsByIdsService } from './modules/event/queries/getEventsById/GetEventsByIds.service';
import { getAllShowingController } from './modules/showing/queries/getAllShowing/getAllShowing.controller';
import { getAllShowingService } from './modules/showing/queries/getAllShowing/getAllShowing.service';
import { getFormOfShowingController } from './modules/showing/queries/getFormOfShowing/getFormOfShowing.controller';
import { getFormOfShowingService } from './modules/showing/queries/getFormOfShowing/getFormOfShowing.service';
import { getShowingDetailController } from './modules/showing/queries/getShowingDetail/getShowingDetail.controller';
import { getShowingDetailService } from './modules/showing/queries/getShowingDetail/getShowingDetail.service';
import { FormRepositoryImpl } from './repository/form/form.impl';
import { TicketTypeSectionRepositoryImpl } from './repository/ticketTypeSection/ticketTypeSection.impl';

@Module({
  imports: [ BookingSvcModule, AuthSvcModule],
  controllers: [
    // Categories
    GetAllCategoriesController,

    // Event
    GetEventFrontDisplayController,
    GetEventFDByIdsController,
    GetRecommendedEventController,
    GetEventDetailRecommendController,
    GetEventDetailController,

    // Showing
    getAllShowingController,
    getFormOfShowingController,
    getShowingDetailController,
  ],
  providers: [
    // Adapters
    SlackService,

    // Utils Command
    CalculateShowingStatusService,
    
    // Categories
    GetAllCategoriesService,

    // Event
    GetAllEventDetailForRAGService,
    GetEventFrontDisplayService,
    GetEventFDByIdsService,
    GetRecommendEventService,
    GetEventDetailRecommendService,
    GetEventDetailService,

    GetEventsByIdsService,
    // Showing
    getAllShowingService,
    getFormOfShowingService,
    getShowingDetailService,

    // Repositories
    { provide: 'CategoriesRepository', useClass: CategoriesRepositoryImpl },
    { provide: 'EventsRepository', useClass: EventsRepositoryImpl },
    { provide: 'EventCategoriesRepository', useClass: EventCategoriesRepositoryImpl },
    { provide: 'ShowingRepository', useClass: ShowingRepositoryImpl },
    { provide: 'SeatmapRepository', useClass: SeatmapRepositoryImpl },
    { provide: 'SeatStatusRepository', useClass: SeatStatusRepositoryImpl},
    { provide: 'TicketTypeRepository', useClass: TicketTypeRepositoryImpl},
    { provide: 'TicketTypeSectionRepository', useClass: TicketTypeSectionRepositoryImpl},
    { provide: 'UserClickHistoryRepository', useClass: UserClickHistoryRepositoryImpl },
    { provide: 'FormRepository', useClass: FormRepositoryImpl },
  ],
  exports: [GetAllEventDetailForRAGService, GetEventFrontDisplayService,GetEventsByIdsService],
})
export class EventSvcModule {}