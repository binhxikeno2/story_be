import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { convertDataToInstance } from "shared/dto/response.dto";


export class RapidGatorSessionItem {
    @ApiProperty()
    @Expose({ name: 'session_id' })
    sessionId?: string;

    @ApiProperty()
    @Expose({ name: 'expire_date' })
    expireDate?: number;

    @ApiProperty()
    @Expose({ name: 'traffic_left' })
    trafficLeft?: string;
}

export class RapidGatorSessionResponseDto {
    @ApiProperty({ type: RapidGatorSessionItem })
    @Expose({ name: 'response' })
    @Type(() => RapidGatorSessionItem)
    response?: RapidGatorSessionItem;

    @ApiProperty()
    @Expose({ name: 'response_status' })
    responseStatus?: number;

    @ApiProperty({ required: false })
    @Expose({ name: 'response_details' })
    responseDetails?: string;

    constructor(data?: Partial<RapidGatorSessionResponseDto>) {
        convertDataToInstance(data, this);
    }
}
