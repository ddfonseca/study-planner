import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ExamTemplateController } from './exam-template.controller';
import { ExamTemplateService } from './exam-template.service';

@Module({
  imports: [PrismaModule],
  controllers: [ExamTemplateController],
  providers: [ExamTemplateService],
  exports: [ExamTemplateService],
})
export class ExamTemplateModule {}
