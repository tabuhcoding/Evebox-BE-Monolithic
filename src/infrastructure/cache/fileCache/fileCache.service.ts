import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Cron } from '@nestjs/schedule';

interface CacheEntry {
  timestamp: number;
  timeout: number;
  data: any;
}

@Injectable()
export class FileCacheService {
  private readonly cacheDir = path.join(process.cwd(), 'cache');
  private readonly logger = new Logger(FileCacheService.name);

  constructor() {
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
      this.logger.error('Error reading cache file', err);
      return null;
    }
  }

  // 🔁 Cron job chạy mỗi 5 phút dọn file hết hạn
  @Cron('0 */12 * * *')
  cleanExpiredCache() {
    const files = fs.readdirSync(this.cacheDir);
    const now = Date.now();
    let deleted = 0;

    for (const file of files) {
      const filePath = path.join(this.cacheDir, file);
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed: CacheEntry = JSON.parse(raw);

        if (now - parsed.timestamp > parsed.timeout * 60 * 1000) {
          fs.unlinkSync(filePath);
          deleted++;
        }
      } catch (err) {
        this.logger.warn(`Skipping corrupted cache file: ${file}`);
      }
    }

    if (deleted > 0) {
      this.logger.log(`🧹 Cleaned ${deleted} expired cache file(s)`);
    }
  }
}
