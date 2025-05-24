import { Injectable } from "@nestjs/common"
import { Order, OrderRepository } from './order.repo'
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service"
import { BaseRepository } from "src/shared/repo/base.repository"
import { Prisma } from "@prisma/client"

@Injectable()
export class OrderRepositoryImpl
  extends BaseRepository<Order, Prisma.OrderDelegate>
  implements OrderRepository
  {
    constructor(protected readonly prisma: PrismaService){
      super(prisma.order, prisma)
    }
  }