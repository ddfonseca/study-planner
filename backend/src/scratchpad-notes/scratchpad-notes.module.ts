import { Module } from '@nestjs/common';
import { ScratchpadNotesController } from './scratchpad-notes.controller';
import { ScratchpadNotesService } from './scratchpad-notes.service';

@Module({
  controllers: [ScratchpadNotesController],
  providers: [ScratchpadNotesService],
  exports: [ScratchpadNotesService],
})
export class ScratchpadNotesModule {}
