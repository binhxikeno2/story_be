import { Module } from '@nestjs/common';
import { QuestionRepository } from 'database/repositories/question.repository';

import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';

@Module({
  imports: [],
  controllers: [QuestionController],
  providers: [QuestionService, QuestionRepository],
})
export class QuestionModule {}
