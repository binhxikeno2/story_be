import { ExposeApiProperty } from 'shared/decorators/property.decorator';

export class ContactResDto {
  @ExposeApiProperty()
  name: string;

  @ExposeApiProperty()
  email: string;

  @ExposeApiProperty()
  subject: string;

  @ExposeApiProperty()
  message: string;

  constructor(data?: Partial<ContactResDto>) {
    Object.assign(this, data);
  }
}
