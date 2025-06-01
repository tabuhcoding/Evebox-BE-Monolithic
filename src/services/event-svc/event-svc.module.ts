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
import { CreateShowingController } from './modules/showing/command/createShowing/createShowing.controller';
import { CreateShowingService } from './modules/showing/command/createShowing/createShowing.service';
import { UpdateShowingController } from './modules/showing/command/updateShowing/updateShowing.controller';
import { UpdateShowingService } from './modules/showing/command/updateShowing/updateShowing.service';
import { DeleteShowingController } from './modules/showing/command/deleteShowing/deleteShowing.controller';
import { DeleteShowingService } from './modules/showing/command/deleteShowing/deleteShowing.service';
import { CreateTicketTypeController } from './modules/ticketType/commands/createTicketType/createTicketType.controller';
import { CreateTicketTypeService } from './modules/ticketType/commands/createTicketType/createTicketType.service';
import { UpdateTicketTypeController } from './modules/ticketType/commands/updateTicketType/updateTicketType.controller';
import { UpdateTicketTypeService } from './modules/ticketType/commands/updateTicketType/updateTicketType.service';
import { DeleteTicketTypeController } from './modules/ticketType/commands/deleteTicketType/deleteTicketType.controller';
import { DeleteTicketTypeService } from './modules/ticketType/commands/deleteTicketType/deleteTicketType.service';
import { CreateFormController } from './modules/form/commands/createForm/createForm.controller';
import { CreateFormService } from './modules/form/commands/createForm/createForm.service';
import { UpdateFormController } from './modules/form/commands/updateForm/updateForm.controller';
import { UpdateFormService } from './modules/form/commands/updateForm/updateForm.service';
import { DeleteFormController } from './modules/form/commands/deleteForm/deleteForm.controller';
import { DeleteFormService } from './modules/form/commands/deleteForm/deleteForm.service';
import { ConnectFormController } from './modules/form/commands/connectFormToShowing/connectFormToShowing.controller';
import { ConnectFormService } from './modules/form/commands/connectFormToShowing/connectFormToShowing.service';
import { CalculateSectionStatusService } from './modules/showing/command/calculateSectionStatus/calculateSectionStatus.service';

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

    // Form
    CreateFormController,
    UpdateFormController,
    DeleteFormController,
    ConnectFormController,

    // Showing
    GetAllShowingController,
    GetFormOfShowingController,
    GetShowingDetailController,
    GetShowingSeatmapController,
    CreateShowingController,
    UpdateShowingController,
    DeleteShowingController,

    // Ticket type
    CreateTicketTypeController,
    UpdateTicketTypeController,
    DeleteTicketTypeController,
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
    CreateEventService,
    UpdateEventService,
    DeleteEventService,

    GetEventsByIdsService,

    // Form
    CreateFormService,
    UpdateFormService,
    DeleteFormService,
    ConnectFormService,

    ///// Showing
    CreateShowingService,
    UpdateShowingService,
    DeleteShowingService,

    // Ticket type
    CreateTicketTypeService,
    UpdateTicketTypeService,
    DeleteTicketTypeService,
    
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