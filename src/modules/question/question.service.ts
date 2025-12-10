import { Injectable } from '@nestjs/common';
import { QuestionRepository } from 'database/repositories/question.repository';

import { QuestionReqDto } from './dto/request.dto';

@Injectable()
export class QuestionService {
  constructor(private questionRepository: QuestionRepository) {}

  public searchQuestion(query: QuestionReqDto) {
    return this.questionRepository.getQuestion(query);
  }
}
