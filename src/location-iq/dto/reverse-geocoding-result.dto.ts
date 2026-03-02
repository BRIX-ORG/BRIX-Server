import { ApiProperty } from '@nestjs/swagger';
import { AddressDto } from './autocomplete-response.dto';

export class ReverseGeocodingResultDto {
    @ApiProperty()
    place_id: string;

    @ApiProperty()
    licence: string;

    @ApiProperty()
    lat: string;

    @ApiProperty()
    lon: string;

    @ApiProperty()
    display_name: string;

    @ApiProperty({ type: AddressDto })
    address: AddressDto;

    @ApiProperty({ type: [String] })
    boundingbox: string[];
}
