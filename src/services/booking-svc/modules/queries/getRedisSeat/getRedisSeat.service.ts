import { Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { GetRedisSeatResponseData, TicketTypeSelectionCache } from './getRedisSeat-response.dto';
import { FileCacheService } from 'src/infrastructure/cache/fileCache/fileCache.service';
import { GetTicketTypeDetailService } from 'src/services/event-svc/modules/ticketType/queries/getTicketTypeDetail/getTicketTypeDetail.service';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';
import { AggregatedSelectTicketTypeItem, SelectTicketTypeData } from '../../../common/type';

@Injectable()
export class GetRedisSeatService {
  constructor(
    private readonly fileCacheService: FileCacheService,
    private readonly getTicketTypeDetailService: GetTicketTypeDetailService,
    private readonly slackService: SlackService,
  ) {}
  async execute(showingId: string, email: string): Promise<Result<GetRedisSeatResponseData, Error>> {
    try{
      const data = await this.fileCacheService.getCacheObjectById(
        'selectTicket',
        {
          showingId: showingId,
        },
        email,
      ) as AggregatedSelectTicketTypeItem | null;

      if (!data) {
        return Err(new Error('Your seat is expired.'));
      }

      const ticketTypeData: SelectTicketTypeData[] = data.data;

      let totalAmount = 0;

      if (!ticketTypeData || ticketTypeData.length === 0) {
        await this.slackService.sendError(`Booking Svc >>> GetRedisSeatService >>> execute: No ticketTypeData found for showingId: ${showingId}`);
        
        return Err(new Error('Your seat TicketType not valid.'));
      }

      let ticketTypeSelection: TicketTypeSelectionCache[] = [];

      for (const ticketType of ticketTypeData) {
        const ticketTypeDetail = await this.getTicketTypeDetailService.getTicketTypeDetail(ticketType.ticketTypeId);
        if (!ticketTypeDetail) {
          await this.slackService.sendError(`Booking Svc >>> GetRedisSeatService >>> execute ticketType: ${ticketType.ticketTypeId}`);
          
          return Err(new Error('Your seat TicketType not valid.'));
        }
        
        if (ticketType.seatId && ticketType.seatId.length > 0) {
          totalAmount += ticketTypeDetail.price * ticketType.seatId.length;
        }
        else if (ticketType.quantity && ticketType.quantity > 0) {
          totalAmount += ticketTypeDetail.price * ticketType.quantity;
        } else {
          await this.slackService.sendError(`Booking Svc >>> GetRedisSeatService >>> execute ticketType: ${ticketType.ticketTypeId} has no seatId or quantity`);
          
          return Err(new Error('Your seat TicketType not valid.'));
        }

        ticketTypeSelection.push({
          tickettypeId: ticketType.ticketTypeId,
          sectionId: ticketType.sectionId,
          quantity: ticketType.quantity,
          seatInfo: ticketType.seatId?.map(seatId => ({
            seatId: seatId,
          })),
          ticketTypeName: ticketTypeDetail.name,
          ticketTypePrice: ticketTypeDetail.price,
        });
      }

      const responseData: GetRedisSeatResponseData = {
        showingId: showingId,
        expiredTime: (data.timeout*60*1000 + data.timestamp - Date.now()) / 1000,
        totalAmount: totalAmount,
        ticketTypeSelection: ticketTypeSelection,
      };

      return Ok(responseData);

    } catch (error) {
      await this.slackService.sendError(`Booking Svc >>> GetRedisSeatService >>> execute: ${error.message}`);

      return Err(new Error('Internal Server Error.'));
    }
  }
}