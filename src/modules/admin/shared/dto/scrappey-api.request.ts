import { convertDataToInstance } from 'shared/dto/response.dto';
import { CheckApiProperty } from 'shared/validators/checkProperty.decorator';
export class ScrappeyApiRequestDto {
  @CheckApiProperty({ type: 'string', required: true })
  cmd: string;

  @CheckApiProperty({ type: 'string', required: true })
  url: string;

  @CheckApiProperty({ type: 'boolean', required: true })
  premiumProxy: boolean;

  @CheckApiProperty({ type: 'string', required: false })
  proxyCountry: string;

  constructor(data?: Partial<ScrappeyApiRequestDto>) {
    convertDataToInstance(data, this);
  }

  toJson(): string {
    return JSON.stringify(this);
  }
}
