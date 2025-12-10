import { Injectable } from '@nestjs/common';
import { ContactRepository } from 'database/repositories/contact.repository';

import { ContactReqDto } from './dto/request.dto';
import { ContactResDto } from './dto/response.dto';

@Injectable()
export class ContactService {
  constructor(private contactRepository: ContactRepository) {}

  public async sendContact(body: ContactReqDto): Promise<ContactResDto> {
    const result = await this.contactRepository.save(body);

    return new ContactResDto({
      ...result,
    });
  }
}
