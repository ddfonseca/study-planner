import { Module } from '@nestjs/common';
import { WorkSessionController } from './work-session.controller';
import { WorkSessionService } from './work-session.service';

@Module({
  controllers: [WorkSessionController],
  providers: [WorkSessionService],
  exports: [WorkSessionService],
})
export class WorkSessionModule {}
