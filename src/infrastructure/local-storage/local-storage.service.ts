import { Injectable } from '@nestjs/common';

@Injectable()
export class TempUserStore {
  private store: Map<string, any> = new Map();

  save(key: string, value: any, ttl: number) {
    this.store.set(key, value);
    setTimeout(() => this.store.delete(key), ttl * 1000);// Xóa sau TTL giây
}

  get(key: string): any {
    return this.store.get(key);
  }

  delete(key: string): void {
    this.store.delete(key);
  }
}
