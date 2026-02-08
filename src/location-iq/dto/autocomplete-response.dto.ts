import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressDto {
    @ApiPropertyOptional({ example: 'Empire State Building', description: 'Name of the place' })
    name?: string;

    @ApiPropertyOptional({ example: '350', description: 'House number' })
    house_number?: string;

    @ApiPropertyOptional({ example: '5th Avenue', description: 'Road name' })
    road?: string;

    @ApiPropertyOptional({ example: 'New York City', description: 'City name' })
    city?: string;

    @ApiPropertyOptional({ example: 'New York', description: 'State/Province name' })
    state?: string;

    @ApiPropertyOptional({ example: '10018', description: 'Postal code' })
    postcode?: string;

    @ApiPropertyOptional({ example: 'United States of America', description: 'Country name' })
    country?: string;

    @ApiPropertyOptional({ example: 'us', description: 'Country code (ISO 3166-1 alpha-2)' })
    country_code?: string;
}

export class AutocompleteResultDto {
    @ApiProperty({ example: '123456789', description: 'Unique place identifier' })
    place_id: string;

    @ApiPropertyOptional({ example: '34633854', description: 'OpenStreetMap ID' })
    osm_id?: string;

    @ApiPropertyOptional({
        example: 'way',
        description: 'OpenStreetMap type (node, way, relation)',
    })
    osm_type?: string;

    @ApiProperty({ example: 'https://locationiq.com/attribution', description: 'License URL' })
    licence: string;

    @ApiProperty({ example: '40.7484284', description: 'Latitude coordinate' })
    lat: string;

    @ApiProperty({ example: '-73.985654619873', description: 'Longitude coordinate' })
    lon: string;

    @ApiPropertyOptional({
        example: ['40.7479226', '40.7489422', '-73.9864855', '-73.9848259'],
        description: 'Bounding box [min_lat, max_lat, min_lon, max_lon]',
        type: [String],
    })
    boundingbox?: string[];

    @ApiPropertyOptional({ example: 'tourism', description: 'Place class' })
    class?: string;

    @ApiPropertyOptional({ example: 'attraction', description: 'Place type' })
    type?: string;

    @ApiProperty({
        example:
            'Empire State Building, 350, 5th Avenue, New York City, New York, 10018, United States of America',
        description: 'Full display name with complete address',
    })
    display_name: string;

    @ApiProperty({
        example: 'Empire State Building',
        description: 'Only the name part of the address',
    })
    display_place: string;

    @ApiProperty({
        example: '350, 5th Avenue, New York City, New York, 10018, United States of America',
        description: 'Complete address without the display_place text',
    })
    display_address: string;

    @ApiPropertyOptional({
        type: AddressDto,
        description: 'Structured address components',
    })
    address?: AddressDto;
}
