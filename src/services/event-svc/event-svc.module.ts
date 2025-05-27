// event-svc.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { CategoriesRepositoryImpl } from './repository/categories/categories.impl';
import { EventsRepositoryImpl } from './repository/events/events.impl';
import { EventCategoriesRepositoryImpl } from './repository/eventCategories/eventCategories.impl';
import { LocationsRepositoryImpl } from './repository/locations/location.impl';
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
import { CreateEventController } from './modules/event/commands/createEvent/createEvent.controller';
import { CreateEventService } from './modules/event/commands/createEvent/createEvent.service';
import { AuthSvcModule } from '../auth-svc/auth-svc.module';
import { GetEventsByIdsService } from './modules/event/queries/getEventsById/GetEventsByIds.service';
import { getAllShowingController as GetAllShowingController } from './modules/showing/queries/getAllShowing/getAllShowing.controller';
import { getAllShowingService as GetAllShowingService } from './modules/showing/queries/getAllShowing/getAllShowing.service';
import { getFormOfShowingController as GetFormOfShowingController } from './modules/showing/queries/getFormOfShowing/getFormOfShowing.controller';
import { getFormOfShowingService as GetFormOfShowingService } from './modules/showing/queries/getFormOfShowing/getFormOfShowing.service';
import { getShowingDetailController as GetShowingDetailController } from './modules/showing/queries/getShowingDetail/getShowingDetail.controller';
import { getShowingDetailService as GetShowingDetailService } from './modules/showing/queries/getShowingDetail/getShowingDetail.service';
import { FormRepositoryImpl } from './repository/form/form.impl';
import { TicketTypeSectionRepositoryImpl } from './repository/ticketTypeSection/ticketTypeSection.impl';
import { UpdateEventController } from './modules/event/commands/updateEvent/updateEvent.controller';
import { UpdateEventService } from './modules/event/commands/updateEvent/updateEvent.service';
import { DeleteEventController } from './modules/event/commands/deleteEvent/deleteEvent.controller';
import { DeleteEventService } from './modules/event/commands/deleteEvent/deleteEvent.service';
import { getShowingSeatmapController as GetShowingSeatmapController } from './modules/showing/queries/getShowingSeatmap/getShowingSeatmap.controller';
import { getShowingSeatmapService as GetShowingSeatmapService } from './modules/showing/queries/getShowingSeatmap/getShowingSeatmap.service';
import { CalculateSectionStatusService } from './modules/showing/command/calculateSectionStatus/calculateSectionStatus.service';
import { FileCacheService } from 'src/infrastructure/cache/fileCache/fileCache.service';

@Module({
  imports: [ BookingSvcModule, forwardRef(() => AuthSvcModule) ],
  controllers: [
    // Categories
    GetAllCategoriesController,

    // Event
    GetEventFrontDisplayController,
    GetEventFDByIdsController,
    GetRecommendedEventController,
    GetEventDetailRecommendController,
    GetEventDetailController,
    CreateEventController,
    UpdateEventController,
    DeleteEventController,

    // Showing
    GetAllShowingController,
    GetFormOfShowingController,
    GetShowingDetailController,
    GetShowingSeatmapController,
  ],
  providers: [
    // Adapters
    SlackService,
    FileCacheService,

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
    CreateEventService,
    UpdateEventService,
    DeleteEventService,

    GetEventsByIdsService,
    ///// Showing
    
    // Commands
    CalculateSectionStatusService,
    // Queries,
    GetAllShowingService,
    GetFormOfShowingService,
    GetShowingDetailService,
    GetShowingSeatmapService,

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
    { provide: 'LocationsRepository', useClass: LocationsRepositoryImpl },
  ],
  exports: [GetAllEventDetailForRAGService, GetEventFrontDisplayService,GetEventsByIdsService],
})
export class EventSvcModule {}