import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { ApiResponseDto } from '@/common/dto/response.dto';
import { LocationIqService } from './location-iq.service';
import { AutocompleteQueryDto, AutocompleteResultDto } from './dto';

@ApiTags('Location')
@Controller('location')
@ApiExtraModels(ApiResponseDto, AutocompleteResultDto)
export class LocationIqController {
    constructor(private readonly locationIqService: LocationIqService) {}

    @Get('autocomplete')
    @ApiOperation({
        summary: 'Autocomplete location search',
        description:
            'Search for location suggestions as the user types. This endpoint wraps the LocationIQ Autocomplete API to avoid exposing API keys to the frontend.',
    })
    @ApiResponse({
        status: 200,
        description: 'List of location suggestions',
        schema: {
            allOf: [
                { $ref: getSchemaPath(ApiResponseDto) },
                {
                    properties: {
                        data: {
                            type: 'array',
                            items: { $ref: getSchemaPath(AutocompleteResultDto) },
                        },
                    },
                },
            ],
        },
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid query parameters',
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid LocationIQ API key',
    })
    @ApiResponse({
        status: 429,
        description: 'Rate limit exceeded',
    })
    @ApiResponse({
        status: 502,
        description: 'LocationIQ API error',
    })
    @ApiResponse({
        status: 503,
        description: 'LocationIQ API is not configured',
    })
    async autocomplete(@Query() query: AutocompleteQueryDto): Promise<AutocompleteResultDto[]> {
        return this.locationIqService.autocomplete(query);
    }
}
