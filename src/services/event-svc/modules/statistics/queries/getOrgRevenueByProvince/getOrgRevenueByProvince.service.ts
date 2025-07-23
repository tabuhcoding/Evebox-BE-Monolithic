import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { ProvinceRevenueData } from "./getOrgRevenueByProvince-response.dto";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { GetAdminAccessService } from "src/services/auth-svc/modules/user/queries/get-admin-access/get-admin-access.service";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { FileCacheService } from "src/infrastructure/cache/fileCache/fileCache.service";
import { DistrictsRepository } from "src/services/event-svc/repository/districts/districts.repo";
import { SaveRevenueDataService } from "src/services/auth-svc/modules/admin/commands/saveRevenueData/saveRevenueData.service";
import { AIAnalystService } from "src/services/auth-svc/modules/admin/commands/aiAnalyst/aiAnalyst.service";
import { Pagination, PaginationQuery } from "src/shared/constants/pagination";
import { AIAnalyst } from "src/services/auth-svc/repository/ai-analyst/ai-analyst.repo";

@Injectable()
export class GetOrgRevenueByProvinceService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    @Inject('DistrictsRepository') private readonly districtsRepository: DistrictsRepository,
    private readonly getAdminAccessService: GetAdminAccessService,
    private readonly slackService: SlackService,
    private readonly fileCacheService: FileCacheService,
    private readonly saveRevenueDataService: SaveRevenueDataService,
    private readonly AIAnalystService: AIAnalystService,
  ) {}

  async execute(): Promise<Result<ProvinceRevenueData[], Error>> {
    try {
      const cacheData = await this.fileCacheService.getCache('getOrgRevenueByProvince', {}) as ProvinceRevenueData[];
      if (cacheData && cacheData.length > 0) {
        return Ok(cacheData);
      }

      const result = await this.eventsRepository.getOrgRevenueByProvince();
      if (result.isErr()) {
        return Err(new Error(result.unwrapErr().message));
      }

      await this.fileCacheService.cacheEndpoint(
        'getOrgRevenueByProvince',
        60 * 24,
        {},
        result.unwrap(),
      )

      return result;
    } catch (error) {
      await this.slackService.sendError(`Event Service - Admin - Statistics >>> GetOrgRevenueByProvinceService: ${error.message}`);
      return Err(new Error('Internal server error'));
    }
  }

  async executeV2(): Promise<Result<ProvinceRevenueData[], Error>> {
    try {
      const cacheData = await this.fileCacheService.getCache('getOrgRevenueByProvinceV2', {}) as ProvinceRevenueData[];
      if (cacheData && cacheData.length > 0) {
        return Ok(cacheData);
      }

      const districts = await this.districtsRepository.findAll({},
        {
          province: true,
        }
      );

      var revenueData = new Map<string, ProvinceRevenueData>();
      districts.forEach(district => {
        switch (district.area_code) {
          case 'HCM_TRUNGTAM':
            const centralData = revenueData.get('HCM_TRUNGTAM') || null;
            revenueData.set('HCM_TRUNGTAM', {
              provinceName: 'Trung Tâm TP.HCM',
              provinceEnName: 'Central HCM City',
              eventCount: centralData? centralData.eventCount + district.eventCount : district.eventCount,
              showingCount: centralData? centralData.showingCount + district.showingCount : district.showingCount,
              totalRevenue: centralData? centralData.totalRevenue + district.totalRevenue : district.totalRevenue,
              area_code: 'HCM_TRUNGTAM',
            })
            break;
          case 'HCM_BAC':
            const northData = revenueData.get('HCM_BAC') || null;
            revenueData.set('HCM_BAC', {
              provinceName: 'Bắc TP.HCM',
              provinceEnName: 'North HCM City',
              eventCount: northData? northData.eventCount + district.eventCount : district.eventCount,
              showingCount: northData? northData.showingCount + district.showingCount : district.showingCount,
              totalRevenue: northData? northData.totalRevenue + district.totalRevenue : district.totalRevenue,
              area_code: 'HCM_BAC',
            })
            break;
          case 'HCM_CONLAI':
            const remainingData = revenueData.get('HCM_CONLAI') || null;
            revenueData.set('HCM_CONLAI', {
              provinceName: 'Còn lại TP.HCM',
              provinceEnName: 'Remaining HCM City',
              eventCount: remainingData? remainingData.eventCount + district.eventCount : district.eventCount,
              showingCount: remainingData? remainingData.showingCount + district.showingCount : district.showingCount,
              totalRevenue: remainingData? remainingData.totalRevenue + district.totalRevenue : district.totalRevenue,
              area_code: 'HCM_CONLAI',
            })
            break;
          default:
            const provinceData = revenueData.get(district.provinceId.toString()) || null;
            revenueData.set(district.provinceId.toString(), {
              provinceName: district.province.name,
              provinceEnName: district.province.en_name,
              eventCount: provinceData? provinceData.eventCount + district.eventCount : district.eventCount,
              showingCount: provinceData? provinceData.showingCount + district.showingCount : district.showingCount,
              totalRevenue: provinceData? provinceData.totalRevenue + district.totalRevenue : district.totalRevenue,
              area_code: district.area_code,
            });
            break;
        }
      });

      const revenueList = Array.from(revenueData.values());

      await this.fileCacheService.cacheEndpoint(
        'getOrgRevenueByProvinceV2',
        60 * 24,
        {},
        revenueList,
      );

      this.calculateDistrictRevenueAndUpdate();

      return Ok(revenueList);
    } catch (error) {
      await this.slackService.sendError(`Event Service - Admin - Statistics >>> GetOrgRevenueByProvinceService: ${error.message}`);
      return Err(new Error('Internal server error'));
    }
  }

  async calculateDistrictRevenueAndUpdate(): Promise<void> {
    try {
      var districts = await this.districtsRepository.getAllWEvent();

      const [eventRevenue, _] = await this.saveRevenueDataService.getEventRevenueWPg({
        page: 1,
        limit: 0,
      })

      districts.forEach(district => {
        district.locations.forEach(location => {
          location.Events.forEach(event => {
            const revenue = eventRevenue.find(rev => rev.eventId === event.id);
            if (revenue) {
              district.totalRevenue += revenue.totalRevenue;
              district.eventCount += 1;
              district.showingCount += event.Showing.length;
            }
          });
        });
      });

      await this.districtsRepository.transactions(districts);

      console.log('District revenue updated successfully');

    } catch (error) {
      await this.slackService.sendError(`Event Service - Admin - Statistics >>> GetOrgRevenueByProvinceService: ${error.message}`);
    }
  }

  async executeV3(): Promise<Result<ProvinceRevenueData[], Error>> {
    try {
      const cacheData = await this.fileCacheService.getCache('getOrgRevenueByProvinceV3', {}) as ProvinceRevenueData[];
      if (cacheData && cacheData.length > 0) {
        return Ok(cacheData);
      }

      const districts = await this.districtsRepository.getAllWEvent();

      var revenueData = new Map<string, (ProvinceRevenueData & { eventIds: number[] })>();
      districts.forEach(district => {
        switch (district.area_code) {
          case 'HCM_TRUNGTAM':
            const centralData = revenueData.get('HCM_TRUNGTAM') || null;
            revenueData.set('HCM_TRUNGTAM', {
              provinceName: 'Trung Tâm TP.HCM',
              provinceEnName: 'Central HCM City',
              eventCount: centralData? centralData.eventCount + district.locations.flatMap(loc => loc.Events).length : district.locations.flatMap(loc => loc.Events).length,
              showingCount: centralData? centralData.showingCount + district.locations.flatMap(loc => loc.Events.flatMap(ev => ev.Showing)).length : district.locations.flatMap(loc => loc.Events.flatMap(ev => ev.Showing)).length,
              totalRevenue: 0,
              area_code: 'HCM_TRUNGTAM',
              eventIds: centralData? [...centralData.eventIds, ...district.locations.flatMap(loc => loc.Events.map(ev => ev.id))] : district.locations.flatMap(loc => loc.Events.map(ev => ev.id)),
            })
            break;
          case 'HCM_BAC':
            const northData = revenueData.get('HCM_BAC') || null;
            revenueData.set('HCM_BAC', {
              provinceName: 'Bắc TP.HCM',
              provinceEnName: 'North HCM City',
              eventCount: northData? northData.eventCount + district.locations.flatMap(loc => loc.Events).length : district.locations.flatMap(loc => loc.Events).length,
              showingCount: northData? northData.showingCount + district.locations.flatMap(loc => loc.Events.flatMap(ev => ev.Showing)).length : district.locations.flatMap(loc => loc.Events.flatMap(ev => ev.Showing)).length,
              totalRevenue: 0,
              area_code: 'HCM_BAC',
              eventIds: northData? [...northData.eventIds, ...district.locations.flatMap(loc => loc.Events.map(ev => ev.id))] : district.locations.flatMap(loc => loc.Events.map(ev => ev.id)),
            })
            break;
          case 'HCM_CONLAI':
            const remainingData = revenueData.get('HCM_CONLAI') || null;
            revenueData.set('HCM_CONLAI', {
              provinceName: 'Còn lại TP.HCM',
              provinceEnName: 'Remaining HCM City',
              eventCount: remainingData? remainingData.eventCount + district.locations.flatMap(loc => loc.Events).length : district.locations.flatMap(loc => loc.Events).length,
              showingCount: remainingData? remainingData.showingCount + district.locations.flatMap(loc => loc.Events.flatMap(ev => ev.Showing)).length : district.locations.flatMap(loc => loc.Events.flatMap(ev => ev.Showing)).length,
              totalRevenue: 0,
              area_code: 'HCM_CONLAI',
              eventIds: remainingData? [...remainingData.eventIds, ...district.locations.flatMap(loc => loc.Events.map(ev => ev.id))] : district.locations.flatMap(loc => loc.Events.map(ev => ev.id)),
            })
            break;
          default:
            const provinceData = revenueData.get(district.provinceId.toString()) || null;
            revenueData.set(district.provinceId.toString(), {
              provinceName: district.province.name,
              provinceEnName: district.province.en_name,
              eventCount: provinceData? provinceData.eventCount + district.locations.flatMap(loc => loc.Events).length : district.locations.flatMap(loc => loc.Events).length,
              showingCount: provinceData? provinceData.showingCount + district.locations.flatMap(loc => loc.Events.flatMap(ev => ev.Showing)).length : district.locations.flatMap(loc => loc.Events.flatMap(ev => ev.Showing)).length,
              totalRevenue: 0,
              area_code: district.area_code,
              eventIds: provinceData? [...provinceData.eventIds, ...district.locations.flatMap(loc => loc.Events.map(ev => ev.id))] : district.locations.flatMap(loc => loc.Events.map(ev => ev.id)),
            });
            break;
        }
      });

      const revenueList = Array.from(revenueData.values());

      const updatedRevenueList = await this.saveRevenueDataService.appendRevenueToProvinces(revenueList);

      const updatedRevenueListWithOutEventIdsAndSort = updatedRevenueList.map(data => ({
        ...data,
        eventIds: null,
      })).sort((a, b) => b.totalRevenue - a.totalRevenue);

      await this.fileCacheService.cacheEndpoint(
        'getOrgRevenueByProvinceV3',
        60 * 24,
        {},
        updatedRevenueListWithOutEventIdsAndSort,
      );

      return Ok(updatedRevenueListWithOutEventIdsAndSort);
    } catch (error) {
      await this.slackService.sendError(`Event Service - Admin - Statistics >>> GetOrgRevenueByProvinceService: ${error.message}`);
      return Err(new Error('Internal server error'));
    }
  }

  async executeAI(userRequest: string): Promise<Result<string, Error>> {
    try {
      var payload: any = {
        query: userRequest || "",
      };

      const cacheData = await this.fileCacheService.getCacheObjectById("analyst-ai", {}, "province");

      if (cacheData && cacheData.data[0].threadId) {
        payload = {
          ...payload,
          threadId: cacheData.data[0].threadId,
        };
      }
      else {
        const chart = await this.executeV3();
        payload = {
          ...payload,
          data: {
            chart: chart.isOk() ? chart.unwrap() : [],
          },
        };
      }
      const responseAI = await fetch(`${process.env.UTILS_URL}/revenue/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!responseAI.ok || responseAI.status !== 200) {
        const errorData = await responseAI.json();
        return Err(new Error(errorData.detail || 'Failed to analyze revenue data'));
      }

      const responseAIData = await responseAI.json();

      await this.slackService.sendNotice(`Event Service - Event summary with AI >>> GetEventSummaryService: ${JSON.stringify(payload)}.
      Result: ${JSON.stringify(responseAIData)}`);

      if (!responseAIData.content) {
        return Err(new Error('No result returned from AI analysis'));
      }
      await this.fileCacheService.cacheObject("analyst-ai",
        20,
        {},
        "province",
        [{
          threadId: responseAIData.threadId
        }]
      );

      try {
        await this.AIAnalystService.createAIAnalyst(
          "admin",
          responseAIData.content,
          responseAIData.threadId,
          "province",
          userRequest || "",
        );
      }catch (error) {
        this.slackService.sendError(`Event Service - Admin - AIAnalyst >>> Create AI Analyst entry failed: ${error.message}`);
      }
      return Ok(responseAIData.content);
    } catch (error) {
      this.slackService.sendError(`EventSvc >> GetOrgRevenueChartService: Failed to get org revenue chart: ${error.message}`);
      return Err(new Error('Internal server error'));
    }
  }

  async getAIAnalyst(pagination: PaginationQuery): Promise<Result<[AIAnalyst[], Pagination], Error>> {
    try {
      const aiAnalystData = await this.AIAnalystService.getAIAnalyst("admin", "province", pagination);

      return Ok(aiAnalystData);
    } catch (error) {
      this.slackService.sendError(`EventSvc >> GetOrgRevenueChartService: Failed to get AI Analyst data: ${error.message}`);
      return Err(new Error('Internal server error'));
    }
  }
}