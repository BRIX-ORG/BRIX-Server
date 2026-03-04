import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import pc from 'picocolors';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private readonly logger = new Logger('HTTP');

    use(req: Request, res: Response, next: NextFunction) {
        const { method, originalUrl, ip } = req;
        const startTime = Date.now();

        res.on('finish', () => {
            const { statusCode } = res;
            const duration = Date.now() - startTime;
            const contentLength = res.get('content-length');

            const methodStr = this.colorMethod(method.padEnd(7));
            const urlStr = pc.white(originalUrl);
            const statusStr = this.colorStatus(statusCode);
            const durationStr = this.colorDuration(duration);
            const sizeStr = contentLength ? pc.dim(`${this.formatSize(contentLength)}`) : '';
            const ipStr = pc.dim(this.formatIp(ip));

            const logMessage = `${methodStr} ${urlStr} ${statusStr} ${durationStr} ${sizeStr} ${pc.dim('-')} ${ipStr}`;

            if (statusCode >= 500) {
                this.logger.error(logMessage);
            } else if (statusCode >= 400) {
                this.logger.warn(logMessage);
            } else {
                this.logger.log(logMessage);
            }
        });

        next();
    }

    private colorMethod(method: string): string {
        const colors: Record<string, (s: string) => string> = {
            GET: pc.green,
            POST: pc.yellow,
            PUT: pc.blue,
            PATCH: pc.cyan,
            DELETE: pc.red,
            OPTIONS: pc.dim,
            HEAD: pc.dim,
        };
        const colorFn = colors[method.trim()] ?? pc.white;
        return pc.bold(colorFn(method));
    }

    private colorStatus(status: number): string {
        const str = `${status}`;
        if (status >= 500) return pc.red(pc.bold(str));
        if (status >= 400) return pc.yellow(pc.bold(str));
        if (status >= 300) return pc.cyan(str);
        return pc.green(pc.bold(str));
    }

    private colorDuration(ms: number): string {
        const text = `${ms}ms`.padStart(6);
        if (ms >= 1000) return pc.red(text);
        if (ms >= 300) return pc.yellow(text);
        return pc.dim(text);
    }

    private formatIp(ip: string | undefined): string {
        if (!ip || ip === '::1') return 'localhost';
        return ip.replace('::ffff:', '');
    }

    private formatSize(bytes: string): string {
        const num = parseInt(bytes, 10);
        if (isNaN(num)) return bytes;
        if (num >= 1048576) return `${(num / 1048576).toFixed(1)}MB`;
        if (num >= 1024) return `${(num / 1024).toFixed(1)}KB`;
        return `${num}B`;
    }
}
