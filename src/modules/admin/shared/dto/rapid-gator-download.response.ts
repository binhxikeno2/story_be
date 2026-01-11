import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { convertDataToInstance } from "shared/dto/response.dto";


export class RapidGatorDownloadItem {
    @ApiProperty()
    @Expose({ name: 'url' })
    url?: string;
}

export class RapidGatorDownloadResponseDto {
    @ApiProperty({ type: RapidGatorDownloadItem })
    @Expose({ name: 'response' })
    @Type(() => RapidGatorDownloadItem)
    response?: RapidGatorDownloadItem;

    @ApiProperty()
    @Expose({ name: 'response_status' })
    responseStatus?: number;

    @ApiProperty({ required: false })
    @Expose({ name: 'response_details' })
    responseDetails?: string;

    constructor(data?: Partial<RapidGatorDownloadResponseDto>) {
        convertDataToInstance(data, this);
    }
}
