import { Prisma, PrismaClient } from '@prisma/client';

export class BaseRepository<
  TModel,
  TDelegate extends {
    create: Function;
    createMany: Function;
    delete: Function;
    deleteMany: Function;
    update: Function;
    updateMany: Function;
    upsert: Function;
    findFirst: Function;
    findUnique: Function;
    findMany: Function;
    count: Function;
  }
> {
  constructor(
    protected readonly repo: TDelegate,
    protected readonly prisma: PrismaClient,
  ) {}

  async deleteHardOne(id: string): Promise<void> {
    await this.repo.delete({ where: { id } });
  }

  async insertOne(data: any): Promise<string> {
    const result = await this.repo.create({ data }) as unknown as { id: string };
    return result.id;
  }

  async insertMany(data: any[]): Promise<void> {
    await this.repo.createMany({ data });
  }

  async updateOne(filter: any, data: any): Promise<void> {
    await this.repo.updateMany({ where: filter, data });
  }

  async updateMany(filter: any, data: any): Promise<void> {
    await this.repo.updateMany({ where: filter, data });
  }

  async findAndUpdateMany(filter: any, data: any): Promise<TModel[]> {
    await this.repo.updateMany({ where: filter, data });
    return this.repo.findMany({ where: filter }) as Promise<TModel[]>;
  }

  async updateOneById(id: string, data: any): Promise<void> {
    await this.repo.update({ where: { id }, data });
  }

  async updateAndFindOneById(id: string, data: any): Promise<TModel> {
    return this.repo.update({ where: { id }, data }) as Promise<TModel>;
  }

  async findOneAndUpsert(filter: any, update: any): Promise<TModel> {
    return this.repo.upsert({
      where: filter,
      update,
      create: update,
    }) as Promise<TModel>;
  }

  async upsertAndFindOne(filter: any, update: any): Promise<TModel> {
    return this.findOneAndUpsert(filter, update);
  }

  async findOne(filter: any): Promise<TModel | null> {
    return this.repo.findFirst({ where: filter }) as Promise<TModel | null>;
  }

  async findOneById(id: string): Promise<TModel | null> {
    return this.repo.findUnique({ where: { id } }) as Promise<TModel | null>;
  }

  async findByIds(ids: string[]): Promise<TModel[]> {
    return this.repo.findMany({ where: { id: { in: ids } } }) as Promise<TModel[]>;
  }

  async findAll(filter: any): Promise<TModel[]> {
    return this.repo.findMany({ where: filter }) as Promise<TModel[]>;
  }

  async findMany(filter: any): Promise<TModel[]> {
    return this.repo.findMany({ where: filter }) as Promise<TModel[]>;
  }

  async count(filter: any): Promise<number> {
    return this.repo.count({ where: filter });
  }

  async runTransactions(
    txs: ((tx: Prisma.TransactionClient) => Promise<any>)[]
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const fn of txs) {
        await fn(tx);
      }
    });
  }
}
