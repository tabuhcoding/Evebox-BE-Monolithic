import { Injectable } from "@nestjs/common";
import { Districts, DistrictsRepository } from "./districts.repo";
import { BaseEventRepository } from "../base.repository";
import { Prisma } from "prisma/client-event";
import { PrismaEventService } from "../../database/prisma-event/prisma.service";

@Injectable()
export class DistrictsRepositoryImpl 
    extends BaseEventRepository<Districts, Prisma.districtsDelegate>
    implements DistrictsRepository {
    
    constructor(protected readonly prisma: PrismaEventService) {
        super(prisma.districts, prisma);
    }
}