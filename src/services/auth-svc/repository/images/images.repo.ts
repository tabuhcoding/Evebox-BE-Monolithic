import { Images, Prisma } from "prisma/client-auth";
import { BaseAuthRepository } from "../base.repository";

export interface ImagesRepository
  extends BaseAuthRepository<Images, Prisma.ImagesDelegate> {
    create(imageUrl: string, userEmail: string): Promise<Images>;
    findAll(userEmail: string): Promise<Images[]>;
    findOne(id: number): Promise<Images | null>;
    update(id: number, imageUrl: string): Promise<Images | null>;
    remove(id: number): Promise<Images | null>;
  }