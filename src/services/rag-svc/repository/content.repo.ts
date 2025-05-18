import { BaseRepository } from "./base.repository";
import { Prisma } from "prisma/client-ai";

export type Content = Prisma.ContentGetPayload<{}>;

export interface ContentRepository extends BaseRepository<Content, Prisma.ContentDelegate> {

  findOneWithChild(id: number): Promise<any>;
  // getAllContent(): Promise<Content[]>;
  // addContent(dto: Content): Promise<Content | null>;
  // getContentTree(id: number): Promise<any>;
}