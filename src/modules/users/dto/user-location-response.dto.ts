import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserLocationResponseDto {
    @ApiProperty({ description: 'The unique identifier of the user', format: 'uuid' })
    id: string;

    @ApiPropertyOptional({ description: 'Latitude coordinate from user address' })
    latitude?: number;

    @ApiPropertyOptional({ description: 'Longitude coordinate from user address' })
    longitude?: number;

    static fromRaw(raw: { id: string; address: unknown }): UserLocationResponseDto | null {
        const addr = raw.address as Record<string, unknown> | null;
        if (!addr || typeof addr.lat === 'undefined' || typeof addr.lon === 'undefined') {
            return null;
        }

        const dto = new UserLocationResponseDto();
        dto.id = raw.id;
        dto.latitude = Number(addr.lat);
        dto.longitude = Number(addr.lon);
        return dto;
    }
}
