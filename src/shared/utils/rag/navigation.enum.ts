export enum RouteEnum {
  HOME_PAGE = 'HOME_PAGE',
  PROFILE_PAGE = 'PROFILE_PAGE',
  CHANGE_PASSWORD_PAGE = 'CHANGE_PASSWORD_PAGE',
  SEARCH_PAGE = 'SEARCH_PAGE',
  EVENT_DETAIL_PAGE = 'EVENT_DETAIL_PAGE',
  CREATE_EVENT_PAGE = 'CREATE_EVENT_PAGE',
  MY_EVENTS_PAGE = 'MY_EVENTS_PAGE',
  EVENT_ANALYSTICS_PAGE = 'EVENT_ANALYSTICS_PAGE',
  MY_TICKETS_PAGE = 'MY_TICKETS_PAGE',
  TUTORIAL_PAGE = 'TUTORIAL_PAGE',
  LEGAL_DOCUMENT_PAGE = 'LEGAL_DOCUMENT_PAGE',
  POLICY_PAGE = 'POLICY_PAGE',
  NONE = 'NONE',
}

export const RouteDescription = {
  [RouteEnum.HOME_PAGE]: 'This page has Special Events, Events only on Evebox, Trending Events, Special Events of each Category, Events this week, Events this month',
  [RouteEnum.PROFILE_PAGE]: 'This page has user profile information',
  [RouteEnum.CHANGE_PASSWORD_PAGE]: 'This page is for changing password',
  [RouteEnum.SEARCH_PAGE]: 'This page has events based on search query. Only select this page if you cant find any page',
  [RouteEnum.CREATE_EVENT_PAGE]: 'This page is for creating new event. User can create new event on this page',
  [RouteEnum.MY_EVENTS_PAGE]: 'This page is for showing all events that user created. User can view and edit event on this page',
  [RouteEnum.MY_TICKETS_PAGE]: 'This page is for showing all tickets that user bought. User can view ticket on this page',
  [RouteEnum.EVENT_ANALYSTICS_PAGE]: 'This page is for showing all analystics of an event about orders, resume, checkin, member. User can view and edit event on this page',
  [RouteEnum.TUTORIAL_PAGE]: 'This page is for showing all tutorial videos about how to use Evebox. Only select this page if the user is clearly confused, asking how to use the platform, or mentioning keywords like "tutorial", "how to use", "guide", etc. Do NOT select this page if the user is asking about specific features like buying tickets, creating events, or viewing events.',
  [RouteEnum.LEGAL_DOCUMENT_PAGE]: 'This page is for showing all legal documents for Organizer of Evebox. Contains: Product, prohibited goods and services, banned advertisements, and content/image moderation regulations.',
  [RouteEnum.POLICY_PAGE]: 'This page is for showing all policies of Evebox. Contains: Terms of Use, Privacy Policy, Payment Privacy Policy, Dispute/Complaint Resolution Mechanism, Return and Inspection Policy, Shipping and Delivery Conditions, and Payment Methods.',
  [RouteEnum.EVENT_DETAIL_PAGE]: 'This page is a detail page of an event, containing information about location, organizer, showing time, ticket price. User also can buy ticket on this page, but required a event id',
  [RouteEnum.NONE]: 'If you cannot find any page, this is the default page',
}

