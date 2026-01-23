import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateScratchpadNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  content: string;
}
