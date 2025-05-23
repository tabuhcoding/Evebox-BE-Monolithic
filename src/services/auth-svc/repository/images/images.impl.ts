import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { Images, Prisma } from "@prisma/client";
import { ImagesRepository } from "./images.repo";

@Injectable()
export class ImagesRepositoryImpl
  extends BaseRepository<Images, Prisma.ImagesDelegate>
  implements ImagesRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.images, prisma);
  }

  async create(imageUrl: string, userEmail: string): Promise<Images> {
  try {
    return await this.prisma.images.create({ data: { imageUrl, userId: userEmail } });
  } catch (error) {
    console.error('Create image failed:', error);
    throw new BadRequestException('Failed to upload image');
  }
}

  async findAll(userEmail: string): Promise<Images[]> {
    return this.prisma.images.findMany({
      where: { userId: userEmail },
      // orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number): Promise<Images | null> {
    return this.prisma.images.findUnique({ where: { id } });
  }

  async update(id: number, imageUrl: string): Promise<Images> {
    return this.prisma.images.update({ where: { id }, data: { imageUrl } });
  }

  async remove(id: number): Promise<Images> {
    return this.prisma.images.delete({ where: { id } });
  }
}