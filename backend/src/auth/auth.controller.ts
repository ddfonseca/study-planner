import { All, Controller, Req } from '@nestjs/common';
import type { Request } from 'express';
import { auth } from './auth.config';

@Controller('api/auth')
export class AuthController {
  @All('*')
  handleAuth(@Req() req: Request) {
    return auth.handler(req as unknown as Request);
  }
}
