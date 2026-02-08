import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AutocompleteQueryDto, AutocompleteResultDto } from './dto';

@Injectable()
export class LocationIqService {
    private readonly logger = new Logger(LocationIqService.name);
    private readonly apiKey: string;
    private readonly baseUrl: string;

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('LOCATION_IQ_API_KEY');
        const baseUrl = this.configService.get<string>('LOCATION_IQ_BASE_URL');
        if (!apiKey) {
            this.logger.warn('LOCATION_IQ_API_KEY is not configured');
        }
        if (!baseUrl) {
            this.logger.warn('LOCATION_IQ_BASE_URL is not configured');
        }
        this.apiKey = apiKey || '';
        this.baseUrl = baseUrl || 'https://api.locationiq.com/v1';
    }

    /**
     * Autocomplete search for location suggestions
     * @param query - Search query parameters
     * @returns Array of autocomplete results
     */
    async autocomplete(query: AutocompleteQueryDto): Promise<AutocompleteResultDto[]> {
        if (!this.apiKey) {
            throw new HttpException(
                'LocationIQ API is not configured',
                HttpStatus.SERVICE_UNAVAILABLE,
            );
        }

        const params = new URLSearchParams({
            key: this.apiKey,
            q: query.q,
            limit: String(query.limit || 10),
            format: 'json',
        });

        if (query.countrycodes) {
            params.append('countrycodes', query.countrycodes);
        }

        if (query.normalizecity !== undefined) {
            params.append('normalizecity', String(query.normalizecity));
        }

        if (query.lang) {
            params.append('accept-language', query.lang);
        }

        const url = `${this.baseUrl}/autocomplete?${params.toString()}`;

        try {
            this.logger.debug(`Calling LocationIQ API: ${url.replace(this.apiKey, '***')}`);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`LocationIQ API error: ${response.status} - ${errorText}`);

                if (response.status === 401) {
                    throw new HttpException('Invalid LocationIQ API key', HttpStatus.UNAUTHORIZED);
                }

                if (response.status === 429) {
                    throw new HttpException(
                        'LocationIQ rate limit exceeded',
                        HttpStatus.TOO_MANY_REQUESTS,
                    );
                }

                throw new HttpException(
                    `LocationIQ API error: ${errorText}`,
                    HttpStatus.BAD_GATEWAY,
                );
            }

            const data = (await response.json()) as AutocompleteResultDto[];
            this.logger.debug(`LocationIQ returned ${data.length} results`);

            return data;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`LocationIQ API request failed: ${message}`);
            throw new HttpException(
                `Failed to fetch location data: ${message}`,
                HttpStatus.BAD_GATEWAY,
            );
        }
    }
}
