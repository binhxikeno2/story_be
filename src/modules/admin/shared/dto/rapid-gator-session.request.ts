import { CheckApiProperty } from "shared/validators/checkProperty.decorator";

export class RapidGatorDownloadRequestDto {
    @CheckApiProperty({ type: 'string', required: true })
    username: string;

    @CheckApiProperty({ type: 'string', required: true })
    password: string;

    constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
    }
}