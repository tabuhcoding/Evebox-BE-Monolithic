import { GetTicketDetailOfShowingService } from './modules/showing/queries/getTicketDetailOfShowing/getTicketDetailOfShowing.service';
import { GetShowingsByAdminService } from './modules/showing/queries/getShowingsByAdmin/getShowings.service';
import { GetShowingAdminDetailService } from './modules/showing/queries/getShowingAdminDetail/getShowingAdminDetail.service';
import { GetEventsByAdminController } from './modules/event/queries/getEventsByAdmin/getEvents.controller';
// event-svc.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CategoriesRepositoryImpl } from './repository/categories/categories.impl';
import { EventsRepositoryImpl } from './repository/events/events.impl';
import { EventCategoriesRepositoryImpl } from './repository/eventCategories/eventCategories.impl';
import { EventUserRelationshipRepositoryImpl } from './repository/eventUserRelationship/eventUserRelationship.impl';
import { EventRoleRepositoryImpl } from './repository/eventRole/eventRole.impl';
import { LocationsRepositoryImpl } from './repository/locations/location.impl';
import { AdminRepositoryImpl } from '../auth-svc/repository/admin/admin.repository.impl';
import { GetAllEventDetailForRAGService } from './modules/event/queries/getAllEventDetailForRAG/getAllEventDetailForRAG.service';
import { GetAllCategoriesController } from './modules/categories/queries/getAllCategories.controller';
import { GetAllCategoriesService } from './modules/categories/queries/getAllCategories.service';
import { GetEventFrontDisplayController } from './modules/event/queries/getEventFrontDisplay/getEventFrontDisplay.controller';
import { GetEventFrontDisplayService } from './modules/event/queries/getEventFrontDisplay/getEventFrontDisplay.service';
import { GetEventFDByIdsService } from './modules/event/queries/getEventFDByIds/getEventFDByIds.service';
import { GetEventFDByIdsController } from './modules/event/queries/getEventFDByIds/getEventFDByIds.controller';
import { GetRecommendedEventController } from './modules/event/queries/getRecommendEvent/getRecommendEvent.controller';
import { GetRecommendEventService } from './modules/event/queries/getRecommendEvent/getRecommendEvent.service';
import { GetEventDetailRecommendController } from './modules/event/queries/getEventDetailRecommend/getEventDetailRecommend.controller';
import { GetEventDetailRecommendService } from './modules/event/queries/getEventDetailRecommend/getEventDetailRecommend.service';
import { BookingSvcModule } from '../booking-svc/booking.module';
import { GetEventDetailController } from './modules/event/queries/getEventDetail/getEventDetail.controller';
import { GetEventDetailService } from './modules/event/queries/getEventDetail/getEventDetail.service';
import { ShowingRepositoryImpl } from './repository/showing/showing.impl';
import { ShowingWithEventRepositoryImpl } from './repository/showing/showingWithEvent.impl';
import { SeatmapRepositoryImpl } from './repository/seatmap/seatmap.impl';
import { SeatStatusRepositoryImpl } from './repository/seatStatus/seatStatus.impl';
import { TicketTypeRepositoryImpl } from './repository/ticketType/ticketType.impl';
import { OrgPaymentInforRepositoryImpl } from './repository/orgPaymentInfor/orgPaymentInfor.impl';
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
import { CreateOrgPaymentInfoController } from './modules/orgPaymentInfor/commands/createOrgPaymentInfor/createOrgPaymentInfor.controller';
import { CreateOrgPaymentInfoService } from './modules/orgPaymentInfor/commands/createOrgPaymentInfor/createOrgPaymentInfor.service';
import { GetOrgPaymentInfoController } from './modules/orgPaymentInfor/queries/getOrgPaymentInfor/getOrgPaymentInfor.controller';
import { UpdateOrgPaymentInfoController } from './modules/orgPaymentInfor/commands/updateOrgPaymentInfor/updateOrgPaymentInfor.controller';
import { UpdateOrgPaymentInfoService } from './modules/orgPaymentInfor/commands/updateOrgPaymentInfor/updateOrgPaymentInfor.service';
import { DeleteOrgPaymentInfoController } from './modules/orgPaymentInfor/commands/deleteOrgPaymentInfor/deleteOrgPaymentInfor.controller';
import { DeleteOrgPaymentInfoService } from './modules/orgPaymentInfor/commands/deleteOrgPaymentInfor/deleteOrgPaymentInfor.service';
import { CalculateSectionStatusService } from './modules/showing/command/calculateSectionStatus/calculateSectionStatus.service';
import { GetOrgPaymentInfoService } from './modules/orgPaymentInfor/queries/getOrgPaymentInfor/getOrgPaymentInfor.service';
import { UpdateEventAdminController } from './modules/event/commands/UpdateEventAdmin/updateEventAdmin.controller';
import { UpdateEventAdminService } from './modules/event/commands/UpdateEventAdmin/updateEventAdmin.service';
import { GetEventsByAdminService } from './modules/event/queries/getEventsByAdmin/getEvents.service';
import { GetEventSpecialManagementController } from './modules/event/queries/getEventSpecialManagement/getEventSpecialManagement.controller';
import { GetEventSpecialManagementService } from './modules/event/queries/getEventSpecialManagement/getEventSpecialManagement.service';
import { GetTicketTypeDetailService } from './modules/ticketType/queries/getTicketTypeDetail/getTicketTypeDetail.service';
import { GetEventMemberController } from './modules/event/queries/getEventMembers/getEventMembers.controller';
import { GetEventMembersService } from './modules/event/queries/getEventMembers/getEventMembers.service';
import { GetEventOfOrgController } from './modules/event/queries/getEventOfOrg/getEventOfOrg.controller';
import { GetEventOfOrgService } from './modules/event/queries/getEventOfOrg/getEventOfOrg.service';
import { GetEventOfOrgDetailController } from './modules/event/queries/getEventOfOrgDetail/getEventOfOrgDetail.controller';
import { GetEventOfOrgDetailService } from './modules/event/queries/getEventOfOrgDetail/getEventOfOrgDetail.service';
import { GetShowingAdminDetailController } from './modules/showing/queries/getShowingAdminDetail/getShowingAdminDetail.controller';
import { GetShowingsByAdminController } from './modules/showing/queries/getShowingsByAdmin/getShowings.controller';
import { GetTicketDetailOfShowingController } from './modules/showing/queries/getTicketDetailOfShowing/getTicketDetailOfShowing.controller';
import { GetEventRolesController } from './modules/event/queries/getEventRoles/getEventRoles.controller';
import { GetEventRolesService } from './modules/event/queries/getEventRoles/getEventRoles.service';
import { GetEventRolesByIdController } from './modules/event/queries/getEventRolesById/getEventRolesById.controller';
import { GetEventRolesByIdService } from './modules/event/queries/getEventRolesById/getEventRolesById.service';
import { GetUserSubmitFormService } from './modules/form/queries/getUserSubmitForm/getUserSubmitForm.service';
import { FormResponseRepositoryImpl } from './repository/formResponse/formResponse.impl';
import { GetEventSummaryController } from './modules/event/queries/getEventSummary/getEventSummary.controller';
import { GetEventSummaryService } from './modules/event/queries/getEventSummary/getEventSummary.service';
import { GetFormResponseByIdService } from './modules/formResponse/queries/getFormResponseById/getFormResponseById.service';
import { CheckUserPermissionService } from './modules/event/commands/checkUserPermission/checkUserPermission.service';
import { GetAnalyticsController } from './modules/event/queries/getAnalytics/getAnalytics.controller';
import { GetAnalyticsService } from './modules/event/queries/getAnalytics/getAnalytics.service';
import { FormAnswerRepositoryImpl } from './repository/formAnswer/formAnswer.impl';
import { UpdateFormResponseService } from './modules/formResponse/commands/updateFormResponse/updateFormResponse.service';
import { FormInputRepositoryImpl } from './repository/formInput/formInput.impl';
import { GetPreviewShowingService } from './modules/showing/queries/getPreviewShowing/getPreviewShowing.service';
import { GetFormAnswerWithQuestionService } from './modules/formAnswer/queries/getFormAnswerWithQuestion/getFormAnswerWithQuestion.service';
import { CalculateTicketTypeStatusService } from './modules/showing/command/calculateTicketTypeStatus/calculateTicketTypeStatus.service';

@Module({
  imports: [ BookingSvcModule, AuthSvcModule, CqrsModule ],
  controllers: [
    // Categories
    GetAllCategoriesController,

    // Event
    GetEventOfOrgController,
    GetEventOfOrgDetailController,
    GetEventFrontDisplayController,
    GetEventFDByIdsController,
    GetRecommendedEventController,
    GetEventDetailRecommendController,
    GetEventDetailController,
    CreateEventController,
    UpdateEventController,
    DeleteEventController,
    GetEventRolesController,
    GetEventRolesByIdController,

    // Event Statistics
    GetEventSummaryController,
    GetAnalyticsController,

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

    // Org Payment info
    CreateOrgPaymentInfoController,
    GetOrgPaymentInfoController,
    UpdateOrgPaymentInfoController,
    DeleteOrgPaymentInfoController,

    
    UpdateEventAdminController, 
    GetEventsByAdminController,
    GetEventSpecialManagementController,
    GetEventMemberController,
    GetShowingAdminDetailController,
    GetShowingsByAdminController,
    GetTicketDetailOfShowingController
  ],
  providers: [
    // Adapters
    // Utils Command
    CalculateShowingStatusService,
    CheckUserPermissionService,
    CalculateTicketTypeStatusService,
    
    // Categories
    GetAllCategoriesService,

    /////// Event
    // Commands
    CreateEventService,
    UpdateEventService,
    DeleteEventService,
    // Queries
    GetAllEventDetailForRAGService,
    GetEventFrontDisplayService,
    GetEventFDByIdsService,
    GetRecommendEventService,
    GetEventDetailRecommendService,
    GetEventDetailService,
    GetEventOfOrgService,
    GetEventOfOrgDetailService,

    GetEventsByIdsService,
    GetEventRolesService,
    GetEventRolesByIdService,

    GetEventSummaryService,
    GetAnalyticsService,

    ///// Showing
    // Commands
    CalculateSectionStatusService,
    CreateShowingService,
    UpdateShowingService,
    DeleteShowingService,
    // Queries,
    GetAllShowingService,
    GetFormOfShowingService,
    GetShowingDetailService,
    GetShowingSeatmapService,
    GetPreviewShowingService,

    // Ticket type
    CreateTicketTypeService,
    UpdateTicketTypeService,
    DeleteTicketTypeService,
    GetTicketTypeDetailService,
    
    // Org payment info
    CreateOrgPaymentInfoService,
    GetOrgPaymentInfoService,
    UpdateOrgPaymentInfoService,
    DeleteOrgPaymentInfoService,

    // Admin Event Management
    // Admin event
    UpdateEventAdminService,
    GetEventsByAdminService,
    GetEventSpecialManagementService,
    GetEventMembersService,
    
    // Form
    CreateFormService,
    UpdateFormService,
    DeleteFormService,
    ConnectFormService,

    GetUserSubmitFormService,
    GetFormAnswerWithQuestionService,

    GetFormResponseByIdService,
    UpdateFormResponseService,

    // Admin showing
    GetShowingAdminDetailService,
    GetShowingsByAdminService,
    GetTicketDetailOfShowingService,

    // Repositories
    { provide: 'AdminRepository', useClass: AdminRepositoryImpl },
    { provide: 'CategoriesRepository', useClass: CategoriesRepositoryImpl },
    { provide: 'EventsRepository', useClass: EventsRepositoryImpl },
    { provide: 'EventCategoriesRepository', useClass: EventCategoriesRepositoryImpl },
    { provide: 'EventUserRelationshipRepository', useClass: EventUserRelationshipRepositoryImpl },
    { provide: 'EventRoleRepository', useClass: EventRoleRepositoryImpl },
    { provide: 'ShowingRepository', useClass: ShowingRepositoryImpl },
    { provide: 'ShowingWithEventRepository', useClass: ShowingWithEventRepositoryImpl },
    { provide: 'SeatmapRepository', useClass: SeatmapRepositoryImpl },
    { provide: 'SeatStatusRepository', useClass: SeatStatusRepositoryImpl},
    { provide: 'TicketTypeRepository', useClass: TicketTypeRepositoryImpl},
    { provide: 'TicketTypeSectionRepository', useClass: TicketTypeSectionRepositoryImpl},
    { provide: 'UserClickHistoryRepository', useClass: UserClickHistoryRepositoryImpl },
    { provide: 'FormRepository', useClass: FormRepositoryImpl },
    { provide: 'LocationsRepository', useClass: LocationsRepositoryImpl },
    { provide: 'OrgPaymentInforRepository', useClass: OrgPaymentInforRepositoryImpl },
    { provide: 'FormResponseRepository', useClass: FormResponseRepositoryImpl },
    { provide: 'FormAnswerRepository', useClass: FormAnswerRepositoryImpl },
    { provide: 'FormInputRepository', useClass: FormInputRepositoryImpl },
  ],
  exports: [
    GetAllEventDetailForRAGService, 
    GetEventFrontDisplayService,
    GetEventsByIdsService,
    GetShowingSeatmapService,
    GetShowingDetailService,
    GetTicketTypeDetailService,
    GetUserSubmitFormService,
    GetFormResponseByIdService,
    CheckUserPermissionService,
    UpdateFormResponseService,
    GetPreviewShowingService,
    GetFormAnswerWithQuestionService,
    CalculateTicketTypeStatusService,
  ],
})
export class EventSvcModule {}