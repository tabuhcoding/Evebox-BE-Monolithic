import { Injectable } from "@nestjs/common";
import { Districts, DistrictsRepository, DistrictsWithEvents } from "./districts.repo";
import { BaseEventRepository } from "../base.repository";
import { Prisma } from "prisma/client-event";
import { PrismaEventService } from "../../database/prisma-event/prisma.service";
import { ProvinceRevenueData } from "../../modules/statistics/queries/getOrgRevenueByProvince/getOrgRevenueByProvince-response.dto";

@Injectable()
export class DistrictsRepositoryImpl 
    extends BaseEventRepository<Districts, Prisma.districtsDelegate>
    implements DistrictsRepository {
    
    constructor(protected readonly prisma: PrismaEventService) {
        super(prisma.districts, prisma);
    }

    async getAllWEvent(): Promise<DistrictsWithEvents[]> {
        return this.prisma.districts.findMany({
            include: {
                province: true,
                locations: {
                    include: {
                        Events: {
                            include: {
                                Showing: true,
                            }
                        }
                    }
                }
            },
        });
    }

    async transactions(districts: Districts[]): Promise<void> {
        const values = districts.map(
            d => `(${d.id}, ${d.totalRevenue}, ${d.eventCount})`
            ).join(",");

            await this.prisma.$executeRawUnsafe(`
            UPDATE "district" AS d SET 
                "totalRevenue" = v."totalRevenue", 
                "eventCount" = v."eventCount"
            FROM (VALUES ${values}) AS v(id, totalRevenue, eventCount)
            WHERE d.id = v.id
            `);
    }
}