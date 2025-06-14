import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Cron } from '@nestjs/schedule';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';

interface CacheEntry {
  timestamp: number;
  timeout: number;
  data: any;
}

interface AggregatedDataItem {
  id: string;
  timestamp: number;
  timeout: number;
  data: any;
}

interface AggregatedCacheEntry {
  timestamp: number;
  timeout: number;
  data: AggregatedDataItem[];
}


@Injectable()
export class FileCacheService {
  private readonly cacheDir = path.join(process.cwd(), 'cache');

  constructor(
    private readonly slackService: SlackService,
  ) {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  private generateCacheFileName(endpoint: string, filter: any): string {
    const endpointSlug = endpoint.replace(/[\/\\]/g, '-');
    const filterHash = crypto
      .createHash('md5')
      .update(JSON.stringify(filter))
      .digest('hex')
      .slice(0, 8);
    return path.join(this.cacheDir, `${endpointSlug}--${filterHash}.json`);
  }

  async cacheEndpoint(
    endpoint: string,
    timeout: number,
    filter: any,
    data: any,
  ): Promise<void> {
    const file = this.generateCacheFileName(endpoint, filter);
    const entry: CacheEntry = {
      timestamp: Date.now(),
      timeout,
      data,
    };
    fs.writeFileSync(file, JSON.stringify(entry), 'utf-8');
  }

  async getCache(endpoint: string, filter: any): Promise<any | null> {
    const file = this.generateCacheFileName(endpoint, filter);
    if (!fs.existsSync(file)) return null;

    try {
      const raw = fs.readFileSync(file, 'utf-8');
      const parsed: CacheEntry = JSON.parse(raw);
      const now = Date.now();

      if (now - parsed.timestamp > parsed.timeout * 60 * 1000) {
        fs.unlinkSync(file);
        return null;
      }

      return parsed.data;
    } catch (err) {
      await this.slackService.sendError(`FileCacheService >>> getCache: Error reading cache file for endpoint ${endpoint} error: ${err.message}`);
      return null;
    }
  }

  async cacheObject(
    endpoint: string,
    timeout: number,
    filter: any,
    id: string,
    data: { [key: string]: any }[]
  ): Promise<boolean> {
    const file = this.generateCacheFileName(endpoint, filter);
    const now = Date.now();
    const newItem: AggregatedDataItem = {
      id: id,
      timestamp: now,
      timeout,
      data,
    };

    let aggregated: AggregatedCacheEntry;

    if (fs.existsSync(file)) {
      try {
        const raw = fs.readFileSync(file, 'utf-8');
        aggregated = JSON.parse(raw);

        const existingIndex = aggregated.data.findIndex((item) => item.id === id);

        if (existingIndex !== -1) {
          aggregated.data.splice(existingIndex, 1);
        }

        aggregated.data.push(newItem);
        aggregated.timestamp = now;
        aggregated.timeout = timeout;
      } catch (err) {
        await this.slackService.sendError(`FileCacheService >>> cacheObject: Error reading cache file for endpoint ${endpoint} error: ${err.message}`);
        aggregated = {
          timestamp: now,
          timeout,
          data: [newItem],
        };
      }
    } else {
      aggregated = {
        timestamp: now,
        timeout,
        data: [newItem],
      };
    }

    fs.writeFileSync(file, JSON.stringify(aggregated), 'utf-8');
    return true;
  }

  async getCacheObject(endpoint: string, filter: any): Promise<AggregatedDataItem[]> {
    const file = this.generateCacheFileName(endpoint, filter);
    const now = Date.now();

    if (!fs.existsSync(file)) return [];

    try {
      const raw = fs.readFileSync(file, 'utf-8');
      const parsed: AggregatedCacheEntry = JSON.parse(raw);

      // Lọc data chưa hết hạn
      const validItems = parsed.data.filter(
        (item) => now - item.timestamp <= item.timeout * 60 * 1000
      );

      // Nếu có phần tử nào đã hết hạn, thì ghi lại file để dọn chúng
      if (validItems.length < parsed.data.length) {
        parsed.data = validItems;
        fs.writeFileSync(file, JSON.stringify(parsed), 'utf-8');
      }

      return validItems;
    } catch (err) {
      await this.slackService.sendError(`FileCacheService >>> getCacheObject: Error reading cache file for endpoint ${endpoint} error: ${err.message}`);
      return [];
    }
  }

  async getCacheObjectById(
    endpoint: string,
    filter: any,
    id: string
  ): Promise<AggregatedDataItem | null> {
    const file = this.generateCacheFileName(endpoint, filter);
    const now = Date.now();

    if (!fs.existsSync(file)) return null;

    try {
      const raw = fs.readFileSync(file, 'utf-8');
      const parsed: AggregatedCacheEntry = JSON.parse(raw);

      const item = parsed.data.find((item) => item.id === id);
      if (!item || now - item.timestamp > item.timeout * 60 * 1000) {
        return null; // Không tìm thấy hoặc đã hết hạn
      }

      return item;
    } catch (err) {
      await this.slackService.sendError(`FileCacheService >>> getCacheObjectById: Error reading cache file for endpoint ${endpoint} error: ${err.message}`);
      return null;
    }
  }

  async clearObject(
    endpoint: string,
    filter: any,
    id: string
  ): Promise<boolean> {
    const file = this.generateCacheFileName(endpoint, filter);

    if (!fs.existsSync(file)) {
      return false; // Không có file cache
    }

    try {
      const raw = fs.readFileSync(file, 'utf-8');
      const aggregated: AggregatedCacheEntry = JSON.parse(raw);

      const originalLength = aggregated.data.length;
      aggregated.data = aggregated.data.filter((item) => item.id !== id);

      if (aggregated.data.length === originalLength) {
        return false; // Không tìm thấy item để xóa
      }

      aggregated.timestamp = Date.now(); // Cập nhật timestamp tổng thể (nếu cần)
      fs.writeFileSync(file, JSON.stringify(aggregated), 'utf-8');
      return true;
    } catch (err) {
      await this.slackService.sendError(`FileCacheService >>> clearObject: Error reading cache file for endpoint ${endpoint} error: ${err.message}`);
      return false;
    }
  }


  // 🔁 Cron job chạy mỗi 4h dọn file hết hạn
  @Cron('0 */4 * * *')
  // @Cron('*/4 * * * *')
  async cleanExpiredCache() {
    const files = fs.readdirSync(this.cacheDir);
    const now = Date.now();
    let deleted = 0;
    await this.slackService.sendNotice('🧹 Starting cache cleanup...')

    for (const file of files) {
      const filePath = path.join(this.cacheDir, file);
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed: CacheEntry = JSON.parse(raw);

        if (now - parsed.timestamp > parsed.timeout * 60 * 1000) {
          fs.unlinkSync(filePath);
          deleted++;

          // Log ra slack
          await this.slackService.sendNotice(
            `🗑️ Cleaned expired cache file: ${file} (Timeout: ${parsed.timeout} minutes, Timestamp: ${new Date(parsed.timestamp).toISOString()})`
          )
        }

      } catch (err) {
        await this.slackService.sendError(`FileCacheService >>> cleanExpiredCache: Error processing cache file ${file} error: ${err.message}`);
      }
    }

    if (deleted > 0) {
      await this.slackService.sendNotice(`🧹 Cache cleanup completed. Deleted ${deleted} expired cache files.`);
    }
  }
}
