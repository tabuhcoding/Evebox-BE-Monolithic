import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { ShowingRepository } from "../showing/showing.repo";
import { EventsRepository } from "../events/events.repo";
import { UserRepository } from "src/services/auth-svc/repository/users/user.repository";
import { Email } from "src/services/auth-svc/modules/user/domain/value-objects/user/email.vo";
import { TicketType, TicketTypeRepository } from "./ticketType.repo";
import { Prisma, TicketTypeStatus } from "@prisma/client";
import { Result, Ok, Err } from "oxide.ts";
import { CreateTicketTypeDto } from "../../modules/ticketType/commands/createTicketType/createTicketType.dto";
import { UpdateTicketTypeDto } from "../../modules/ticketType/commands/updateTicketType/updateTicketType.dto";

@Injectable()
export class TicketTypeRepositoryImpl
  extends BaseRepository<TicketType, Prisma.TicketTypeDelegate>
  implements TicketTypeRepository {
  constructor(
    @Inject('ShowingRepository') private readonly showingRepository: ShowingRepository,
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    protected readonly prisma: PrismaService
  ) {
    super(prisma.ticketType, prisma);
  }

  async createTicketType(dto: CreateTicketTypeDto, showingId: string, userEmail: string): Promise<Result<[string, boolean], Error>> {
    try {
      const emailOrError = Email.create(userEmail);
      if (emailOrError.isErr()) {
        return Err(emailOrError.unwrapErr());
      }
      const emailUnwrapped = emailOrError.unwrap();
      const user = await this.userRepository.findByEmail(emailUnwrapped);

      if (user.role.isCustomer && (dto.isFree || dto.originalPrice > 0) ) {
        return Err(new Error('Normal customer can only create free event'));
      }

      const ticketTypeId = await this.insertOne({
        name: dto.name,
        showingId,
        status: TicketTypeStatus.BOOK_NOW,
        description: dto.description,
        color: dto.color,
        isFree: dto.isFree,
        price: Number(dto.originalPrice),
        originalPrice: Number(dto.originalPrice),
        startTime: dto.startTime,
        endTime: dto.endTime,
        position: Number(dto.position),
        imageUrl: dto.imageUrl,
        maxQtyPerOrder: Number(dto.maxQtyPerOrder),
        minQtyPerOrder: Number(dto.minQtyPerOrder),
        isHidden: false,
        quantity: dto.quantity ? Number(dto.quantity) : 0,
      });

      if (!ticketTypeId) {
        return Err(new Error('Failed to create ticket type'));
      }

      const showing = await this.showingRepository.findOneById(showingId);
      
      const event = await this.eventsRepository.findOneById(Number(showing.eventId));

      return Ok([ticketTypeId, event.isApproved]);
    } catch (error) {
      console.error(`Failed to create ticket type: ${error.message}`);
      return Err(new Error(`Failed to create ticket type: ${error.message}`));
    }
  }

  async updateTicketType(dto: UpdateTicketTypeDto, id: string, userEmail: string): Promise<Result<[string, boolean], Error>> {
    try {
      const emailOrError = Email.create(userEmail);
      if (emailOrError.isErr()) {
        return Err(emailOrError.unwrapErr());
      }
      const emailUnwrapped = emailOrError.unwrap();
      const user = await this.userRepository.findByEmail(emailUnwrapped);

      if (user.role.isCustomer && (dto.isFree || dto.originalPrice > 0) ) {
        return Err(new Error('Normal customer can only handle free event'));
      }

      const ticketType = await this.findOneById(id);

      const showing = await this.showingRepository.findOneById(ticketType.showingId);

      const event = await this.eventsRepository.findOneById(Number(showing.eventId));

      const updateData: any = {};
      if (dto.status !== undefined)  updateData.status = dto.status;
      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.color !== undefined) updateData.color = dto.color;
      if (dto.isFree !== undefined) updateData.isFree = dto.isFree;
      if (dto.originalPrice !== undefined) {
        updateData.originalPrice = dto.originalPrice;
        updateData.price = dto.originalPrice;
      }
      if (dto.startTime !== undefined) updateData.startTime = dto.startTime;
      if (dto.endTime !== undefined) updateData.endTime = dto.endTime;
      if (dto.position !== undefined) updateData.position = dto.position;
      if (dto.quantity !== undefined) updateData.quantity = dto.quantity;
      if (dto.maxQtyPerOrder !== undefined) updateData.maxQtyPerOrder = dto.maxQtyPerOrder;
      if (dto.minQtyPerOrder !== undefined) updateData.minQtyPerOrder = dto.minQtyPerOrder;
      if (dto.isHidden !== undefined) updateData.isHidden = dto.isHidden;
      if (dto.imageUrl) updateData.imageUrl = dto.imageUrl;

      const startTimeValid = dto.startTime || ticketType.startTime;
      const endTimeValid = dto.endTime || ticketType.endTime;

      if (startTimeValid && endTimeValid && new Date(startTimeValid) > new Date(endTimeValid)) {
        return Err(new Error('Showing startTime must be before endTime'));
      }

      const updatedTicketType = await this.updateAndFindOneById(id, updateData);
      if (!updatedTicketType) {
        return Err(new Error('Failed to update ticket type'));
      }

      return Ok([updatedTicketType.id, event.isApproved]);
    } catch (error) {
      console.error(`Failed to update ticket type: ${error.message}`);
      return Err(new Error(`Failed to update ticket type: ${error.message}`));
    }
  }

  async deleteTicketType(id: string): Promise<Result<string, Error>> {
    try {
      const ticketType = await this.findOneById(id);

      if (ticketType.deleteAt === null) {
        const updatedTicketType = await this.updateAndFindOneById(id, {
          deleteAt: new Date()
        });

        if (!updatedTicketType) {
          return Err(new Error('Failed to update ticket type'));
        }

        return Ok(updatedTicketType.id);
      }

      return Err(new Error('Ticket type not found or could not be deleted'));
    } catch (error) {
      console.error(`Failed to delete ticket type: ${error.message}`);
      return Err(new Error(`Failed to delete ticket type: ${error.message}`));
    }
  }
}