import { Module } from '@nestjs/common';
import { ExamProfileController } from './exam-profile.controller';
import { ExamProfileService } from './exam-profile.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExamProfileController],
  providers: [ExamProfileService],
  exports: [ExamProfileService],
})
export class ExamProfileModule {}
