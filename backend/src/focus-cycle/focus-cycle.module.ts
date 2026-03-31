import { Module } from '@nestjs/common';
import { FocusCycleController } from './focus-cycle.controller';
import { FocusCycleService } from './focus-cycle.service';

@Module({
  controllers: [FocusCycleController],
  providers: [FocusCycleService],
  exports: [FocusCycleService],
})
export class FocusCycleModule {}
