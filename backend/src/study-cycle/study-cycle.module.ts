import { Module } from '@nestjs/common';
import { StudyCycleController } from './study-cycle.controller';
import { StudyCycleService } from './study-cycle.service';

@Module({
  controllers: [StudyCycleController],
  providers: [StudyCycleService],
  exports: [StudyCycleService],
})
export class StudyCycleModule {}
