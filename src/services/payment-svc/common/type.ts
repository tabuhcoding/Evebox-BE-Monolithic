import { GetRedisSeatResponseData } from "src/services/booking-svc/modules/queries/getRedisSeat/getRedisSeat-response.dto";

export interface AggregatedCheckoutDataItem {
  id: string; // user email
  timestamp: number;
  timeout: number;
  data: GetRedisSeatResponseData[];
}